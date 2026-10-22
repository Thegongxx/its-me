"""Minimal Win32 adapters. We deliberately never call GetWindowText or inspect browser data."""
from __future__ import annotations
import ctypes
from ctypes import wintypes
import hashlib
import os
from pathlib import Path
import subprocess
import sys

def require_windows() -> None:
    if sys.platform != "win32": raise RuntimeError("这个托盘采集器仅支持 Windows")

def foreground_process() -> str | None:
    require_windows()
    user32, kernel32 = ctypes.WinDLL("user32", use_last_error=True), ctypes.WinDLL("kernel32", use_last_error=True)
    user32.GetForegroundWindow.restype = wintypes.HWND
    user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    hwnd = user32.GetForegroundWindow()
    if not hwnd: return None
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    handle = kernel32.OpenProcess(0x1000, False, pid.value)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not handle: return None
    try:
        size = wintypes.DWORD(32768)
        buffer = ctypes.create_unicode_buffer(size.value)
        if not kernel32.QueryFullProcessImageNameW(handle, 0, buffer, ctypes.byref(size)): return None
        # Full path is used only by the OS API, immediately reduced locally, never logged or uploaded.
        return Path(buffer.value).name.lower()
    finally: kernel32.CloseHandle(handle)

def idle_seconds() -> float:
    require_windows()
    class LASTINPUTINFO(ctypes.Structure):
        _fields_ = [("cbSize", wintypes.UINT), ("dwTime", wintypes.DWORD)]
    info = LASTINPUTINFO(ctypes.sizeof(LASTINPUTINFO), 0)
    user32, kernel32 = ctypes.WinDLL("user32"), ctypes.WinDLL("kernel32")
    user32.GetLastInputInfo.argtypes = [ctypes.POINTER(LASTINPUTINFO)]
    kernel32.GetTickCount64.restype = ctypes.c_ulonglong
    if not user32.GetLastInputInfo(ctypes.byref(info)): return float("inf")
    return ((kernel32.GetTickCount64() - info.dwTime) & 0xFFFFFFFF) / 1000

class DATA_BLOB(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_ubyte))]

def _crypt(data: bytes, decrypt: bool) -> bytes:
    require_windows()
    backing = (ctypes.c_ubyte * len(data)).from_buffer_copy(data)
    source, target = DATA_BLOB(len(data), backing), DATA_BLOB()
    crypt32, kernel32 = ctypes.WinDLL("crypt32", use_last_error=True), ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.LocalFree.argtypes = [wintypes.HLOCAL]
    kernel32.LocalFree.restype = wintypes.HLOCAL
    if decrypt:
        fn = crypt32.CryptUnprotectData
        fn.argtypes = [ctypes.POINTER(DATA_BLOB), ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(DATA_BLOB)]
        ok = fn(ctypes.byref(source), None, None, None, None, 1, ctypes.byref(target))
    else:
        fn = crypt32.CryptProtectData
        fn.argtypes = [ctypes.POINTER(DATA_BLOB), wintypes.LPCWSTR, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(DATA_BLOB)]
        ok = fn(ctypes.byref(source), "Build Log device credential", None, None, None, 1, ctypes.byref(target))
    if not ok: raise OSError("无法使用 Windows 用户级凭证保护，请重新配置")
    try: return ctypes.string_at(target.pbData, target.cbData)
    finally: kernel32.LocalFree(ctypes.cast(target.pbData, wintypes.HLOCAL))

def protect(token: str) -> bytes: return _crypt(token.encode("utf-8"), False)
def unprotect(data: bytes) -> str: return _crypt(data, True).decode("utf-8")

class InstanceLock:
    def __init__(self, config_dir: Path):
        require_windows()
        self.kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        self.kernel32.CreateMutexW.argtypes = [ctypes.c_void_p, wintypes.BOOL, wintypes.LPCWSTR]
        self.kernel32.CreateMutexW.restype = wintypes.HANDLE
        self.kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
        name = "Local\\BuildLogAgent-" + hashlib.sha256(str(config_dir.resolve()).encode()).hexdigest()[:20]
        self.handle = self.kernel32.CreateMutexW(None, False, name)
        if not self.handle: raise OSError("无法创建单实例锁")
        if ctypes.get_last_error() == 183:
            self.close()
            raise RuntimeError("采集器已经运行；请在系统托盘中操作")
    def close(self):
        if self.handle: self.kernel32.CloseHandle(self.handle); self.handle = None

def set_startup(enabled: bool, script: Path, config_dir: Path) -> None:
    require_windows()
    import winreg
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run") as key:
        if enabled:
            pythonw = Path(sys.executable).with_name("pythonw.exe")
            if not pythonw.exists(): raise RuntimeError("当前 Python 安装缺少 pythonw.exe")
            command = subprocess.list2cmdline([str(pythonw), str(script.resolve()), "--config-dir", str(config_dir.resolve()), "run"])
            winreg.SetValueEx(key, "BuildLogAgent", 0, winreg.REG_SZ, command)
        else:
            try: winreg.DeleteValue(key, "BuildLogAgent")
            except FileNotFoundError: pass

def data_directory() -> Path:
    return Path(os.environ.get("APPDATA", str(Path.home()))) / "BuildLogAgent"
