-- EV Route Planner Database Schema for Supabase (PostgreSQL)
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Car Brands Table
CREATE TABLE IF NOT EXISTS car_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Car Models Table
CREATE TABLE IF NOT EXISTS car_models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES car_brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    battery_capacity_kwh DECIMAL(5,2) NOT NULL,
    range_km INTEGER NOT NULL,
    charging_speed_kw DECIMAL(5,2) DEFAULT 50.0,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand_id, name)
);

-- 3. Charging Stations Table
CREATE TABLE IF NOT EXISTS charging_stations (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    charger_type VARCHAR(50),
    power_kw DECIMAL(5,2),
    available BOOLEAN DEFAULT true,
    operator VARCHAR(100),
    cost_per_unit DECIMAL(5,2),
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Users Table (basic - use Supabase Auth for production)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    car_brand VARCHAR(100),
    car_model VARCHAR(100),
    selected_car_model_id INTEGER REFERENCES car_models(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. User Routes History (optional)
CREATE TABLE IF NOT EXISTS user_routes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_lat DECIMAL(10,8) NOT NULL,
    start_lng DECIMAL(11,8) NOT NULL,
    end_lat DECIMAL(10,8) NOT NULL,
    end_lng DECIMAL(11,8) NOT NULL,
    distance_km DECIMAL(6,2),
    charging_stops JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_car_models_brand ON car_models(brand_id);
CREATE INDEX idx_charging_stations_location ON charging_stations(latitude, longitude);
CREATE INDEX idx_users_email ON users(email);

-- Insert Sample Car Brands (Indian EV Market)
INSERT INTO car_brands (name, logo_url) VALUES
    ('Tata Motors', 'https://example.com/logos/tata.png'),
    ('Mahindra', 'https://example.com/logos/mahindra.png'),
    ('MG Motor', 'https://example.com/logos/mg.png'),
    ('Hyundai', 'https://example.com/logos/hyundai.png'),
    ('BYD', 'https://example.com/logos/byd.png')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Car Models (Popular Indian EVs)
INSERT INTO car_models (brand_id, name, battery_capacity_kwh, range_km, charging_speed_kw) VALUES
    -- Tata Motors
    ((SELECT id FROM car_brands WHERE name = 'Tata Motors'), 'Nexon EV', 40.5, 437, 50.0),
    ((SELECT id FROM car_brands WHERE name = 'Tata Motors'), 'Nexon EV Max', 40.5, 453, 50.0),
    ((SELECT id FROM car_brands WHERE name = 'Tata Motors'), 'Tiago EV', 24.0, 315, 33.0),
    ((SELECT id FROM car_brands WHERE name = 'Tata Motors'), 'Tigor EV', 26.0, 315, 33.0),
    
    -- Mahindra
    ((SELECT id FROM car_brands WHERE name = 'Mahindra'), 'XUV400', 39.4, 456, 50.0),
    ((SELECT id FROM car_brands WHERE name = 'Mahindra'), 'e2o Plus', 15.9, 140, 16.0),
    
    -- MG Motor
    ((SELECT id FROM car_brands WHERE name = 'MG Motor'), 'ZS EV', 50.3, 461, 50.0),
    ((SELECT id FROM car_brands WHERE name = 'MG Motor'), 'Comet EV', 17.3, 230, 7.2),
    
    -- Hyundai
    ((SELECT id FROM car_brands WHERE name = 'Hyundai'), 'Kona Electric', 39.2, 452, 50.0),
    ((SELECT id FROM car_brands WHERE name = 'Hyundai'), 'IONIQ 5', 72.6, 631, 350.0),
    
    -- BYD
    ((SELECT id FROM car_brands WHERE name = 'BYD'), 'Atto 3', 60.48, 521, 80.0),
    ((SELECT id FROM car_brands WHERE name = 'BYD'), 'e6', 71.7, 520, 80.0)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Sample Charging Stations (Gujarat & Major Indian Cities)
INSERT INTO charging_stations (id, name, latitude, longitude, city, state, charger_type, power_kw, operator) VALUES
    -- Ahmedabad
    ('CS001', 'Tata Power Charging - SG Highway', 23.0225, 72.5714, 'Ahmedabad', 'Gujarat', 'CCS2', 60.0, 'Tata Power'),
    ('CS002', 'Statiq Charging Hub - Vastrapur', 23.0395, 72.5269, 'Ahmedabad', 'Gujarat', 'CCS2', 50.0, 'Statiq'),
    ('CS003', 'Ather Grid - Satellite', 23.0258, 72.5093, 'Ahmedabad', 'Gujarat', 'Type 2', 22.0, 'Ather'),
    
    -- Mumbai
    ('CS004', 'Tata Power - Bandra Kurla', 19.0596, 72.8656, 'Mumbai', 'Maharashtra', 'CCS2', 60.0, 'Tata Power'),
    ('CS005', 'Fortum Charge - Andheri', 19.1136, 72.8697, 'Mumbai', 'Maharashtra', 'CCS2', 50.0, 'Fortum'),
    
    -- Delhi
    ('CS006', 'EESL Charging - Connaught Place', 28.6315, 77.2167, 'Delhi', 'Delhi', 'CCS2', 50.0, 'EESL'),
    ('CS007', 'Statiq - Vasant Kunj', 28.5244, 77.1579, 'Delhi', 'Delhi', 'CCS2', 60.0, 'Statiq'),
    
    -- Bangalore
    ('CS008', 'Tata Power - Whitefield', 12.9698, 77.7499, 'Bangalore', 'Karnataka', 'CCS2', 60.0, 'Tata Power'),
    ('CS009', 'Ather Grid - Indiranagar', 12.9784, 77.6408, 'Bangalore', 'Karnataka', 'Type 2', 22.0, 'Ather'),
    
    -- Pune
    ('CS010', 'Fortum Charge - Hinjewadi', 18.5913, 73.7389, 'Pune', 'Maharashtra', 'CCS2', 50.0, 'Fortum')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE car_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE charging_stations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access on car_brands" 
    ON car_brands FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access on car_models" 
    ON car_models FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access on charging_stations" 
    ON charging_stations FOR SELECT 
    USING (true);

-- Comments
COMMENT ON TABLE car_brands IS 'EV car manufacturers available in the system';
COMMENT ON TABLE car_models IS 'Specific EV models with battery and range specifications';
COMMENT ON TABLE charging_stations IS 'Charging station locations with power ratings';
COMMENT ON TABLE users IS 'Registered users with their preferred car details';
