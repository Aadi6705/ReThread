-- ==============================================================================
-- ReThread Campus Marketplace — Clean Supabase Database Setup
-- Run this script in the Supabase Dashboard SQL Editor.
-- ==============================================================================

-- Cleanly reset public schema to eliminate any partial run conflicts
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

BEGIN;

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> c367a7a8c2ae

CREATE TABLE IF NOT EXISTS categories (
    id UUID NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    slug VARCHAR(100) NOT NULL, 
    description TEXT, 
    icon VARCHAR(100), 
    is_active BOOLEAN NOT NULL, 
    CONSTRAINT categories_pkey PRIMARY KEY (id), 
    CONSTRAINT categories_name_key UNIQUE (name)
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);

CREATE TABLE IF NOT EXISTS colleges (
    id UUID NOT NULL, 
    name VARCHAR(255) NOT NULL, 
    email_domain VARCHAR(100) NOT NULL, 
    campus_name VARCHAR(255) NOT NULL, 
    location VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    CONSTRAINT colleges_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS colleges_email_domain_idx ON colleges (email_domain);

CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL, 
    college_id UUID NOT NULL, 
    email VARCHAR(255) NOT NULL, 
    password_hash VARCHAR(255) NOT NULL, 
    is_email_verified BOOLEAN NOT NULL, 
    account_status VARCHAR(50) NOT NULL, 
    last_login_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT users_pkey PRIMARY KEY (id), 
    CONSTRAINT users_college_id_fkey FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS users_college_id_idx ON users (college_id);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    token_hash VARCHAR(255) NOT NULL, 
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    used_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id), 
    CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS email_verification_tokens_token_hash_idx ON email_verification_tokens (token_hash);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx ON email_verification_tokens (user_id);

CREATE TABLE IF NOT EXISTS listings (
    id UUID NOT NULL, 
    seller_id UUID NOT NULL, 
    college_id UUID NOT NULL, 
    category_id UUID NOT NULL, 
    title VARCHAR(255) NOT NULL, 
    description TEXT NOT NULL, 
    price NUMERIC(10, 2) NOT NULL, 
    original_price NUMERIC(10, 2), 
    condition VARCHAR(50) NOT NULL, 
    brand VARCHAR(100), 
    status VARCHAR(50) NOT NULL, 
    published_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT listings_pkey PRIMARY KEY (id), 
    CONSTRAINT listings_category_id_fkey FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE RESTRICT, 
    CONSTRAINT listings_college_id_fkey FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE RESTRICT, 
    CONSTRAINT listings_seller_id_fkey FOREIGN KEY(seller_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_listings_category_price ON listings (category_id, price);

CREATE INDEX IF NOT EXISTS ix_listings_status_college ON listings (status, college_id);

CREATE INDEX IF NOT EXISTS listings_category_id_idx ON listings (category_id);

CREATE INDEX IF NOT EXISTS listings_college_id_idx ON listings (college_id);

CREATE INDEX IF NOT EXISTS listings_seller_id_idx ON listings (seller_id);

CREATE INDEX IF NOT EXISTS listings_status_idx ON listings (status);

CREATE INDEX IF NOT EXISTS listings_title_idx ON listings (title);

CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    full_name VARCHAR(100) NOT NULL, 
    profile_image VARCHAR(500), 
    department VARCHAR(100), 
    course VARCHAR(100), 
    academic_year VARCHAR(50), 
    bio TEXT, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT student_profiles_pkey PRIMARY KEY (id), 
    CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS student_profiles_user_id_idx ON student_profiles (user_id);

CREATE TABLE IF NOT EXISTS listing_images (
    id UUID NOT NULL, 
    listing_id UUID NOT NULL, 
    image_url VARCHAR(500) NOT NULL, 
    cloudinary_public_id VARCHAR(255) NOT NULL, 
    display_order INTEGER NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    CONSTRAINT listing_images_pkey PRIMARY KEY (id), 
    CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES listings (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS listing_images_listing_id_idx ON listing_images (listing_id);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID NOT NULL, 
    listing_id UUID NOT NULL, 
    buyer_id UUID NOT NULL, 
    seller_id UUID NOT NULL, 
    status VARCHAR(50) NOT NULL, 
    buyer_message TEXT, 
    meetup_location VARCHAR(255), 
    meetup_datetime TIMESTAMP WITH TIME ZONE, 
    buyer_confirmed BOOLEAN NOT NULL, 
    seller_confirmed BOOLEAN NOT NULL, 
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    completed_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT transactions_pkey PRIMARY KEY (id), 
    CONSTRAINT transactions_buyer_id_fkey FOREIGN KEY(buyer_id) REFERENCES users (id) ON DELETE RESTRICT, 
    CONSTRAINT transactions_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES listings (id) ON DELETE RESTRICT, 
    CONSTRAINT transactions_seller_id_fkey FOREIGN KEY(seller_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_transactions_buyer_status ON transactions (buyer_id, status);

CREATE INDEX IF NOT EXISTS ix_transactions_seller_status ON transactions (seller_id, status);

CREATE INDEX IF NOT EXISTS transactions_buyer_id_idx ON transactions (buyer_id);

CREATE INDEX IF NOT EXISTS transactions_listing_id_idx ON transactions (listing_id);

CREATE INDEX IF NOT EXISTS transactions_seller_id_idx ON transactions (seller_id);

CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions (status);

CREATE TABLE IF NOT EXISTS wishlists (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    listing_id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    CONSTRAINT wishlists_pkey PRIMARY KEY (id), 
    CONSTRAINT wishlists_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES listings (id) ON DELETE CASCADE, 
    CONSTRAINT wishlists_user_id_fkey FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_user_listing_wishlist UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS wishlists_listing_id_idx ON wishlists (listing_id);

CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON wishlists (user_id);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID NOT NULL, 
    listing_id UUID, 
    transaction_id UUID, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT conversations_pkey PRIMARY KEY (id), 
    CONSTRAINT conversations_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES listings (id) ON DELETE SET NULL, 
    CONSTRAINT conversations_transaction_id_fkey FOREIGN KEY(transaction_id) REFERENCES transactions (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON conversations (listing_id);

CREATE INDEX IF NOT EXISTS conversations_transaction_id_idx ON conversations (transaction_id);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    type VARCHAR(100) NOT NULL, 
    title VARCHAR(255) NOT NULL, 
    message TEXT NOT NULL, 
    related_listing_id UUID, 
    related_transaction_id UUID, 
    is_read BOOLEAN NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    CONSTRAINT notifications_pkey PRIMARY KEY (id), 
    CONSTRAINT notifications_related_listing_id_fkey FOREIGN KEY(related_listing_id) REFERENCES listings (id) ON DELETE SET NULL, 
    CONSTRAINT notifications_related_transaction_id_fkey FOREIGN KEY(related_transaction_id) REFERENCES transactions (id) ON DELETE SET NULL, 
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_notifications_user_unread ON notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at);

CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications (is_read);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID NOT NULL, 
    conversation_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    last_read_at TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT conversation_participants_pkey PRIMARY KEY (id), 
    CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, 
    CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_conversation_user_participant UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON conversation_participants (conversation_id);

CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON conversation_participants (user_id);

CREATE TABLE IF NOT EXISTS messages (
    id UUID NOT NULL, 
    conversation_id UUID NOT NULL, 
    sender_id UUID NOT NULL, 
    message_text TEXT NOT NULL, 
    is_deleted BOOLEAN NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    edited_at TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT messages_pkey PRIMARY KEY (id), 
    CONSTRAINT messages_conversation_id_fkey FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, 
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY(sender_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_messages_conv_created ON messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages (sender_id);

INSERT INTO alembic_version (version_num) VALUES ('c367a7a8c2ae') RETURNING alembic_version.version_num;

-- Running upgrade c367a7a8c2ae -> a0f921f5576c

ALTER TABLE conversations ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE conversations ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE listings ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE listings ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE student_profiles ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE student_profiles ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE transactions ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE transactions ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

UPDATE alembic_version SET version_num='a0f921f5576c' WHERE alembic_version.version_num = 'c367a7a8c2ae';

-- Running upgrade a0f921f5576c -> 28fd3bae603e

ALTER TABLE listings ADD COLUMN view_count INTEGER DEFAULT '0' NOT NULL;

UPDATE alembic_version SET version_num='28fd3bae603e' WHERE alembic_version.version_num = 'a0f921f5576c';

-- Running upgrade 28fd3bae603e -> 41e15e8b1d9a

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_active_listing ON transactions (listing_id) WHERE status IN ('accepted', 'meetup_scheduled');

UPDATE alembic_version SET version_num='41e15e8b1d9a' WHERE alembic_version.version_num = '28fd3bae603e';

-- Running upgrade 41e15e8b1d9a -> 52f26f9c2e0b

CREATE INDEX IF NOT EXISTS ix_listings_status_created_at ON listings (status, created_at);

CREATE INDEX IF NOT EXISTS ix_listings_status_price ON listings (status, price);

CREATE INDEX IF NOT EXISTS ix_transactions_listing_status ON transactions (listing_id, status);

ALTER TABLE listings ADD CONSTRAINT listings_chk_listings_price_positive_check CHECK (price >= 0);

UPDATE alembic_version SET version_num='52f26f9c2e0b' WHERE alembic_version.version_num = '41e15e8b1d9a';

COMMIT;



-- Seed Colleges
INSERT INTO colleges (id, name, email_domain, campus_name, location, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Indian Institute of Technology Delhi', 'iitd.ac.in', 'Hauz Khas Campus', 'New Delhi, Delhi', NOW()),
('a0000000-0000-0000-0000-000000000002', 'Birla Institute of Technology and Science, Pilani', 'bits-pilani.ac.in', 'Pilani Campus', 'Pilani, Rajasthan', NOW()),
('a0000000-0000-0000-0000-000000000003', 'University of Delhi', 'du.ac.in', 'North Campus', 'Delhi', NOW()),
('a0000000-0000-0000-0000-000000000004', 'Generic Campus Demo', 'campus.edu', 'Main Campus', 'Bengaluru, Karnataka', NOW())
ON CONFLICT (email_domain) DO NOTHING;

-- Seed Categories
INSERT INTO categories (id, name, slug, description, icon, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'Electronics', 'electronics', 'Calculators, laptops, headphones, monitors & chargers', 'Laptop', true),
('b0000000-0000-0000-0000-000000000002', 'Books & Notes', 'books', 'Engineering textbooks, semester notes & competitive exam prep', 'BookOpen', true),
('b0000000-0000-0000-0000-000000000003', 'Apparel & Thrift', 'apparel', 'College hoodies, jackets, casual wear & vintage thrift', 'Shirt', true),
('b0000000-0000-0000-0000-000000000004', 'Footwear', 'footwear', 'Sneakers, boots, athletic shoes & formal wear', 'Footprints', true),
('b0000000-0000-0000-0000-000000000005', 'Dorm & Furniture', 'furniture', 'Desks, study lamps, mattress toppers, chairs & storage racks', 'Armchair', true),
('b0000000-0000-0000-0000-000000000006', 'Sports & Fitness', 'sports', 'Badminton racquets, footballs, yoga mats & gym gear', 'Dumbbell', true),
('b0000000-0000-0000-0000-000000000007', 'Accessories', 'accessories', 'Backpacks, tote bags, watches & sunglasses', 'Watch', true),
('b0000000-0000-0000-0000-000000000008', 'Other', 'other', 'Miscellaneous campus essentials and items', 'Layers', true)
ON CONFLICT (name) DO NOTHING;
