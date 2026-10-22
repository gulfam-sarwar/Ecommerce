-- Run this ONCE if you already created the database with the old schema.sql.
-- (New installs do not need it: schema.sql already includes this table.)
USE ecommerce;

CREATE TABLE IF NOT EXISTS GUEST_CART_ITEMS (
    guest_cart_item_id INT NOT NULL AUTO_INCREMENT,
    device_id CHAR(36) NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guest_cart_item_id),
    UNIQUE (device_id, product_id),
    FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id) ON DELETE CASCADE,
    CHECK (quantity > 0)
);
