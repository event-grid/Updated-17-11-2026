-- DEMO DATA for local development and demos only (owner decision 2026-11-13).
-- Every business here is fictional: names start with "Demo", is_demo = true, and there are no ratings or reviews.
-- Cities and prices are placeholders; launch geography (D-30) is not decided. Switch off with DEMO_DATA_MIGRATIONS= (empty).

-- Providers -----------------------------------------------------------------------------------------------
INSERT INTO provider.provider (slug, provider_type_code, display_name, city, area, about, approval_status, approved_at, is_demo) VALUES
    ('demo-lotus-banquets', 'COMPANY', 'Demo Lotus Banquets', 'Hyderabad', 'Madhapur', 'Demo banquet business for development.', 'APPROVED', now(), true),
    ('demo-garden-choultry', 'COMPANY', 'Demo Garden Choultry', 'Hyderabad', 'Kukatpally', 'Demo choultry for development.', 'APPROVED', now(), true),
    ('demo-celebration-party-hall', 'COMPANY', 'Demo Celebration Party Hall', 'Bengaluru', 'Indiranagar', 'Demo party hall for development.', 'APPROVED', now(), true),
    ('demo-lakeside-resort', 'COMPANY', 'Demo Lakeside Resort', 'Bengaluru', 'Whitefield', 'Demo resort for development.', 'APPROVED', now(), true),
    ('demo-city-open-ground', 'COMPANY', 'Demo City Open Ground', 'Hyderabad', 'Gachibowli', 'Demo open ground for development.', 'APPROVED', now(), true),
    ('demo-community-auditorium', 'COMPANY', 'Demo Community Auditorium', 'Bengaluru', 'Jayanagar', 'Demo auditorium for development.', 'APPROVED', now(), true),
    ('demo-frames-photography', 'INDIVIDUAL', 'Demo Frames Photography', 'Hyderabad', 'Banjara Hills', 'Demo photographer for development.', 'APPROVED', now(), true),
    ('demo-spice-caterers', 'COMPANY', 'Demo Spice Caterers', 'Hyderabad', 'Ameerpet', 'Demo caterer for development.', 'APPROVED', now(), true),
    ('demo-bloom-decorators', 'COMPANY', 'Demo Bloom Decorators', 'Hyderabad', 'Kondapur', 'Demo decorator for development.', 'APPROVED', now(), true),
    ('demo-glow-makeup-studio', 'INDIVIDUAL', 'Demo Glow Makeup Studio', 'Bengaluru', 'Koramangala', 'Demo makeup artist for development.', 'APPROVED', now(), true),
    ('demo-beats-dj', 'INDIVIDUAL', 'Demo Beats DJ', 'Bengaluru', 'HSR Layout', 'Demo DJ for development.', 'APPROVED', now(), true),
    ('demo-pandal-works', 'COMPANY', 'Demo Pandal Works', 'Hyderabad', 'Secunderabad', 'Demo pandal supplier for development.', 'APPROVED', now(), true),
    ('demo-wedding-wear-rentals', 'COMPANY', 'Demo Wedding Wear Rentals', 'Hyderabad', 'Abids', 'Demo rental shop for development.', 'APPROVED', now(), true),
    ('demo-little-joys-decor', 'INDIVIDUAL', 'Demo Little Joys Decor', 'Bengaluru', 'Malleswaram', 'Demo decorator for development.', 'APPROVED', now(), true);

-- Venues --------------------------------------------------------------------------------------------------
INSERT INTO catalog.venue (provider_id, slug, venue_type_code, name, city, area, description, capacity_min, capacity_max,
                           publication_status, published_at, is_demo)
SELECT p.id, v.slug, v.type, v.name, p.city, p.area, v.description, v.cmin, v.cmax, 'PUBLISHED', now(), true
FROM (VALUES
    ('demo-lotus-banquets', 'demo-lotus-banquets-madhapur', 'banquet', 'Demo Lotus Banquets',
        'Air-conditioned demo banquet hall with a stage and dining area.', 150, 600),
    ('demo-garden-choultry', 'demo-garden-choultry-kukatpally', 'choultry', 'Demo Garden Choultry',
        'Demo choultry with a mandapam, dining hall and guest rooms.', 300, 1200),
    ('demo-celebration-party-hall', 'demo-celebration-party-hall-indiranagar', 'party-hall', 'Demo Celebration Party Hall',
        'Demo party hall for birthdays and small gatherings.', 30, 120),
    ('demo-lakeside-resort', 'demo-lakeside-resort-whitefield', 'resort', 'Demo Lakeside Resort',
        'Demo resort with a lawn by the lake for outdoor events.', 50, 400),
    ('demo-city-open-ground', 'demo-city-open-ground-gachibowli', 'open-ground', 'Demo City Open Ground',
        'Demo open ground for large outdoor and college events.', 500, 3000),
    ('demo-community-auditorium', 'demo-community-auditorium-jayanagar', 'auditorium', 'Demo Community Auditorium',
        'Demo auditorium with fixed seating and a stage.', 100, 800)
) AS v(provider_slug, slug, type, name, description, cmin, cmax)
JOIN provider.provider p ON p.slug = v.provider_slug;

-- What each venue owner states about services (SR-2). NOT_ALLOWED produces "the owner does not allow xyz services".
INSERT INTO catalog.venue_service_availability (venue_id, service_id, status)
SELECT v.id, s.id, a.status
FROM (VALUES
    ('demo-lotus-banquets-madhapur', 'food', 'PROVIDED'),
    ('demo-lotus-banquets-madhapur', 'decoration', 'ALLOWED'),
    ('demo-lotus-banquets-madhapur', 'photography', 'ALLOWED'),
    ('demo-lotus-banquets-madhapur', 'music-and-djs', 'NOT_ALLOWED'),
    ('demo-garden-choultry-kukatpally', 'food', 'NOT_ALLOWED'),
    ('demo-garden-choultry-kukatpally', 'decoration', 'PROVIDED'),
    ('demo-garden-choultry-kukatpally', 'pandal-system', 'ALLOWED'),
    ('demo-garden-choultry-kukatpally', 'photography', 'ALLOWED'),
    ('demo-celebration-party-hall-indiranagar', 'decorators', 'PROVIDED'),
    ('demo-celebration-party-hall-indiranagar', 'food', 'ALLOWED'),
    ('demo-celebration-party-hall-indiranagar', 'music', 'NOT_ALLOWED'),
    ('demo-lakeside-resort-whitefield', 'food', 'PROVIDED'),
    ('demo-lakeside-resort-whitefield', 'photography', 'ALLOWED'),
    ('demo-lakeside-resort-whitefield', 'djs-and-lightnings', 'NOT_ALLOWED'),
    ('demo-city-open-ground-gachibowli', 'pandal-system', 'ALLOWED'),
    ('demo-city-open-ground-gachibowli', 'food', 'ALLOWED'),
    ('demo-community-auditorium-jayanagar', 'food', 'NOT_ALLOWED'),
    ('demo-community-auditorium-jayanagar', 'stage-and-decorators', 'PROVIDED')
) AS a(venue_slug, service_code, status)
JOIN catalog.venue v ON v.slug = a.venue_slug
JOIN catalog.service s ON s.code = a.service_code;

-- Service listings -----------------------------------------------------------------------------------------
INSERT INTO catalog.service_listing (provider_id, service_id, category_id, venue_id, slug, title, description, city,
                                     serves_veg, serves_non_veg, publication_status, published_at, is_demo)
SELECT p.id, s.id, c.id, v.id, l.slug, l.title, l.description, p.city, l.veg, l.nonveg, 'PUBLISHED', now(), true
FROM (VALUES
    ('demo-lotus-banquets', 'venues', 'weddings-and-reception', 'demo-lotus-banquets-madhapur', 'demo-lotus-banquets-hall-rental',
        'Banquet hall rental', 'Hall, stage and dining area. Demo listing.', NULL::boolean, NULL::boolean),
    ('demo-garden-choultry', 'venues', 'weddings-and-reception', 'demo-garden-choultry-kukatpally', 'demo-garden-choultry-rental',
        'Choultry rental', 'Mandapam, dining hall and guest rooms. Demo listing.', NULL, NULL),
    ('demo-celebration-party-hall', 'venue', 'birthday-parties', 'demo-celebration-party-hall-indiranagar', 'demo-celebration-party-hall-rental',
        'Party hall rental', 'Hall with music system and seating. Demo listing.', NULL, NULL),
    ('demo-lakeside-resort', 'places', 'outdoor-events', 'demo-lakeside-resort-whitefield', 'demo-lakeside-resort-lawn',
        'Lakeside lawn booking', 'Lawn by the lake for outdoor events. Demo listing.', NULL, NULL),
    ('demo-city-open-ground', 'open-grounds-and-auditorium-halls', 'college-and-school-events', 'demo-city-open-ground-gachibowli', 'demo-city-open-ground-booking',
        'Open ground booking', 'Large ground for fests and outdoor events. Demo listing.', NULL, NULL),
    ('demo-community-auditorium', 'open-grounds-and-auditorium-halls', 'college-and-school-events', 'demo-community-auditorium-jayanagar', 'demo-community-auditorium-booking',
        'Auditorium booking', 'Fixed seating with stage and sound. Demo listing.', NULL, NULL),
    ('demo-frames-photography', 'photography', 'weddings-and-reception', NULL, 'demo-frames-wedding-photography',
        'Wedding and pre-wedding photography', 'Candid and traditional coverage. Demo listing.', NULL, NULL),
    ('demo-spice-caterers', 'food', 'weddings-and-reception', NULL, 'demo-spice-caterers-wedding-food',
        'Wedding catering — veg and non-veg', 'Separate veg and non-veg kitchens. Demo listing.', true, true),
    ('demo-bloom-decorators', 'decoration', 'weddings-and-reception', NULL, 'demo-bloom-wedding-decoration',
        'Wedding decoration', 'Stage, mandapam and home decoration. Demo listing.', NULL, NULL),
    ('demo-glow-makeup-studio', 'makeup', 'weddings-and-reception', NULL, 'demo-glow-bridal-makeup',
        'Bridal makeup and mehandi', 'Makeup, hair styling and mehandi. Demo listing.', NULL, NULL),
    ('demo-beats-dj', 'music-and-djs', 'weddings-and-reception', NULL, 'demo-beats-dj-nights',
        'DJ for sangeet and reception', 'Sound and lights included. Demo listing.', NULL, NULL),
    ('demo-pandal-works', 'pandal-system', 'weddings-and-reception', NULL, 'demo-pandal-works-wedding-pandal',
        'Wedding pandal setup', 'Pandal, lighting and seating. Demo listing.', NULL, NULL),
    ('demo-wedding-wear-rentals', 'wearables', 'weddings-and-reception', NULL, 'demo-wedding-wear-rentals',
        'Wedding wear rental', 'Sherwanis, lehengas and jewellery on rent. Demo listing.', NULL, NULL),
    ('demo-little-joys-decor', 'decorators', 'birthday-parties', NULL, 'demo-little-joys-birthday-decor',
        'Birthday theme decoration', 'Balloons, backdrops and themes. Demo listing.', NULL, NULL),
    ('demo-little-joys-decor', 'decorations', 'baby-shower', NULL, 'demo-little-joys-baby-shower-decor',
        'Baby shower decoration', 'Floral and pastel themes. Demo listing.', NULL, NULL)
) AS l(provider_slug, service_code, category_code, venue_slug, slug, title, description, veg, nonveg)
JOIN provider.provider p ON p.slug = l.provider_slug
JOIN catalog.service s ON s.code = l.service_code
JOIN catalog.event_category c ON c.code = l.category_code
LEFT JOIN catalog.venue v ON v.slug = l.venue_slug;

-- Packages (prices in paise) -------------------------------------------------------------------------------
INSERT INTO catalog.listing_package (listing_id, title, description, inclusions, price_minor, price_unit, min_quantity, max_quantity, sort_order)
SELECT sl.id, k.title, k.description, k.inclusions, k.price, k.unit, k.qmin, k.qmax, k.sort
FROM (VALUES
    ('demo-lotus-banquets-hall-rental', 'Full day', 'Hall for one full day (8 am to 11 pm).', ARRAY['Air conditioning', 'Stage', 'Dining area', 'Power backup'], 15000000, 'FIXED', 1, 1, 1),
    ('demo-lotus-banquets-hall-rental', 'Evening reception', 'Hall from 5 pm to 11 pm.', ARRAY['Air conditioning', 'Stage', 'Dining area'], 9000000, 'FIXED', 1, 1, 2),
    ('demo-garden-choultry-rental', 'Two-day wedding', 'Choultry for two days, including guest rooms.', ARRAY['Mandapam', 'Dining hall', '10 guest rooms', 'Decoration'], 32000000, 'FIXED', 1, 1, 1),
    ('demo-celebration-party-hall-rental', 'Four-hour party', 'Hall for four hours.', ARRAY['Music system', 'Seating for 120', 'Decoration'], 2500000, 'FIXED', 1, 1, 1),
    ('demo-lakeside-resort-lawn', 'Lawn, evening', 'Lakeside lawn from 4 pm to 11 pm.', ARRAY['Lawn', 'Lighting', 'Catering by the resort'], 12000000, 'FIXED', 1, 1, 1),
    ('demo-city-open-ground-booking', 'Full day', 'Open ground for one day.', ARRAY['Ground', 'Parking', 'Water supply'], 6000000, 'FIXED', 1, 1, 1),
    ('demo-community-auditorium-booking', 'Half day', 'Auditorium for five hours.', ARRAY['800 seats', 'Stage', 'Sound system'], 4500000, 'FIXED', 1, 1, 1),
    ('demo-frames-wedding-photography', 'Wedding day coverage', 'One photographer and one videographer for the wedding day.', ARRAY['Photography', 'Videography', 'Edited album'], 4500000, 'FIXED', 1, 1, 1),
    ('demo-frames-wedding-photography', 'Pre-wedding shoot', 'Half-day outdoor shoot at one location.', ARRAY['4 hours', '50 edited photos'], 2500000, 'FIXED', 1, 1, 2),
    ('demo-spice-caterers-wedding-food', 'Veg meals', 'Per plate: 2 sweets, 3 curries, rice, rotis, dessert.', ARRAY['Veg kitchen', 'Serving staff'], 45000, 'PER_GUEST', 50, 2000, 1),
    ('demo-spice-caterers-wedding-food', 'Non-veg meals', 'Per plate: biryani, 2 curries, starters, dessert.', ARRAY['Non-veg kitchen', 'Serving staff'], 65000, 'PER_GUEST', 50, 2000, 2),
    ('demo-bloom-wedding-decoration', 'Stage decoration', 'Floral stage with backdrop and lighting.', ARRAY['Flowers', 'Backdrop', 'Lighting'], 3500000, 'FIXED', 1, 1, 1),
    ('demo-bloom-wedding-decoration', 'Home decoration', 'Entrance and living room floral decoration.', ARRAY['Flowers', 'Lights'], 1500000, 'FIXED', 1, 1, 2),
    ('demo-glow-bridal-makeup', 'Bridal makeup', 'Bridal makeup and hair styling for the wedding day.', ARRAY['Makeup', 'Hair styling', 'Draping'], 1800000, 'FIXED', 1, 1, 1),
    ('demo-glow-bridal-makeup', 'Bridal mehandi', 'Full hands and feet bridal mehandi.', ARRAY['Organic henna'], 600000, 'FIXED', 1, 1, 2),
    ('demo-beats-dj-nights', 'DJ night, 4 hours', 'DJ with sound and lights.', ARRAY['DJ', 'Sound system', 'Lights'], 2200000, 'FIXED', 1, 1, 1),
    ('demo-pandal-works-wedding-pandal', 'Pandal for up to 500 guests', 'Pandal with lighting and seating.', ARRAY['Pandal', 'Lighting', 'Chairs'], 4000000, 'FIXED', 1, 1, 1),
    ('demo-wedding-wear-rentals', 'Sherwani rental', 'One sherwani for up to three days.', ARRAY['Sherwani', 'Stole'], 450000, 'FIXED', 1, 5, 1),
    ('demo-wedding-wear-rentals', 'Bridal jewellery set rental', 'One jewellery set for up to three days.', ARRAY['Necklace', 'Earrings', 'Bangles'], 800000, 'FIXED', 1, 3, 2),
    ('demo-little-joys-birthday-decor', 'Theme decoration', 'Balloon arch, backdrop and table decoration.', ARRAY['Balloons', 'Backdrop', 'Cake table'], 850000, 'FIXED', 1, 1, 1),
    ('demo-little-joys-baby-shower-decor', 'Baby shower decoration', 'Floral backdrop, seating and photo corner.', ARRAY['Backdrop', 'Floral decoration', 'Photo corner'], 1200000, 'FIXED', 1, 1, 1)
) AS k(listing_slug, title, description, inclusions, price, unit, qmin, qmax, sort)
JOIN catalog.service_listing sl ON sl.slug = k.listing_slug;
