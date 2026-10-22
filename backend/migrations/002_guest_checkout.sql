-- Run this ONCE if you already created the database before "guest checkout".
-- (New installs do not need it: schema.sql already includes these columns.)
--
-- It adds three optional columns to ORDERS. When someone checks out without
-- an account, their contact details are saved here.
USE ecommerce;

ALTER TABLE ORDERS
    ADD COLUMN guest_name VARCHAR(100) NULL,
    ADD COLUMN guest_email VARCHAR(150) NULL,
    ADD COLUMN guest_phone VARCHAR(20) NULL;
