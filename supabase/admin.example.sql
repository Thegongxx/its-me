-- Run manually in the intended project's SQL Editor AFTER creating/inviting the Auth user.
-- Replace this UUID with the exact user's Auth UUID. Never authorize via editable user_metadata.
-- insert into public.admin_users(user_id) values ('REPLACE_WITH_AUTH_USER_UUID');

-- Revoke admin access immediately (existing authenticated sessions then fail authorization):
-- delete from public.admin_users where user_id = 'REPLACE_WITH_AUTH_USER_UUID';
