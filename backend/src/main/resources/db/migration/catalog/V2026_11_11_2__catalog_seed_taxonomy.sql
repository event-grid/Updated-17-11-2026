-- catalog module: seed of the source catalogue (documentation/01-business/EVENT_CATEGORY_CATALOG.md).
-- Every source term is stored verbatim, including spelling and punctuation (MVP scope rule 1).
-- display_name for categories uses the working names from the owner's brief, pending decision D-01.
-- Services: one row per distinct source term; terms that differ only in capitalisation share a row,
-- and each category keeps its own verbatim wording in category_service.source_label (ADR-017, D-12).
-- Totals must match catalogue section 8: 12 categories, 12 event types, 12 subcategories, 46 category services.

INSERT INTO catalog.event_category (code, source_main_name, source_section_name, display_name, sort_order) VALUES
    ('weddings-and-reception',    'Weddings + Reception',     'Weddings and Events',                                       'Weddings and Reception',    1),
    ('meetups-and-gatherings',    'Meetups',                  'Meetups/ Gatherings',                                       'Meetups and Gatherings',    2),
    ('birthday-parties',          'Birthday Party',           'Birthday Parties',                                          'Birthday Parties',          3),
    ('surprise-events',           'Surprise Events Planners', NULL,                                                        'Surprise Events',           4),
    ('photography',               'Photography',              'Photographers',                                             'Photography',               5),
    ('food-and-catering',         'Catering',                 'Foods',                                                     'Food and Catering',         6),
    ('baby-shower',               'Baby Shower',              'Baby Shower',                                               'Baby Shower',               7),
    ('event-managers',            'Event Managers',           'Event Managers (Event Companies those manage all Events)', 'Event Managers',            8),
    ('corporate-events',          'Corporate events',         'Corporate events',                                          'Corporate Events',          9),
    ('college-and-school-events', 'College Events',           'College and School Events',                                 'College and School Events', 10),
    ('outdoor-events',            'Outdoor Events',           'Outdoors Events',                                           'Outdoor Events',            11),
    ('venues',                    'Venue',                    'Venues ( all types of venues)',                             'Venues',                    12);

-- Event types (source "Sub Types") and subcategories (unlabelled numbered items).
INSERT INTO catalog.event_subcategory (category_id, kind, code, source_label, display_name, sort_order)
SELECT c.id, v.kind, v.code, v.label, v.label, v.ord
FROM (VALUES
    ('weddings-and-reception', 'EVENT_TYPE',  'anniversary',                        'Anniversary',                                                  1),
    ('weddings-and-reception', 'EVENT_TYPE',  'normal-weddings',                    'Normal Weddings',                                              2),
    ('weddings-and-reception', 'EVENT_TYPE',  'religious-weddings',                 'Religious Weddings',                                           3),
    ('weddings-and-reception', 'EVENT_TYPE',  'civil-weddings',                     'Civil Weddings',                                               4),
    ('weddings-and-reception', 'EVENT_TYPE',  'multicultural-weddings',             'Multicultural Weddings',                                       5),
    ('weddings-and-reception', 'EVENT_TYPE',  'micro-weddings',                     'Micro-Weddings',                                               6),
    ('weddings-and-reception', 'EVENT_TYPE',  'destination-weddings',               'Destination Weddings',                                         7),
    ('weddings-and-reception', 'EVENT_TYPE',  'mass-weddings',                      'Mass Weddings',                                                8),
    ('weddings-and-reception', 'EVENT_TYPE',  'outdoor-weddings',                   'Outdoor Weddings',                                             9),
    ('weddings-and-reception', 'EVENT_TYPE',  'themed-weddings',                    'Themed Weddings',                                              10),
    ('meetups-and-gatherings', 'EVENT_TYPE',  'alumini-meetups',                    'Alumini Meetups',                                              1),
    ('meetups-and-gatherings', 'EVENT_TYPE',  '10th-batch-meetups',                 '10th batch meetups',                                           2),
    ('photography',            'SUBCATEGORY', 'wedding-shoot',                      'Wedding shoot',                                                1),
    ('photography',            'SUBCATEGORY', 'party-shoots',                       'Party Shoots',                                                 2),
    ('photography',            'SUBCATEGORY', 'general-photographs',                'General Photographs',                                          3),
    ('photography',            'SUBCATEGORY', 'festives',                           'Festives',                                                     4),
    ('food-and-catering',      'SUBCATEGORY', 'veg-and-non-veg-caterings',          'Veg and non veg Caterings',                                    1),
    ('food-and-catering',      'SUBCATEGORY', 'bakers-and-chats',                   'Bakers and chats',                                             2),
    ('food-and-catering',      'SUBCATEGORY', 'veg',                                'Veg',                                                          3),
    ('food-and-catering',      'SUBCATEGORY', 'non-veg',                            'Non veg',                                                      4),
    ('food-and-catering',      'SUBCATEGORY', 'soft-drinks',                        'Soft drinks',                                                  5),
    ('event-managers',         'SUBCATEGORY', 'social-and-private-event-companies', 'Social and Private Event Companies (list of events manage company)', 1),
    ('corporate-events',       'SUBCATEGORY', 'internal-corporate-events',          'Internal Corporate Events',                                    1),
    ('corporate-events',       'SUBCATEGORY', 'external-corporate-events',          'External Corporate Events',                                    2)
) AS v (category_code, kind, code, label, ord)
JOIN catalog.event_category c ON c.code = v.category_code;

-- Services: one row per distinct source term (capitalisation-only variants share a row).
INSERT INTO catalog.service (code, name) VALUES
    ('venues',                                 'Venues'),
    ('photography',                            'Photography'),
    ('wearables',                              'Wearables'),
    ('makeup',                                 'Makeup'),
    ('decoration',                             'Decoration'),
    ('food',                                   'Food'),
    ('invitation-printers',                    'Invitation Printers'),
    ('tent',                                   'Tent'),
    ('gifts',                                  'Gifts'),
    ('music-and-djs',                          'Music & Dj’S'),
    ('pandal-system',                          'Pandal System'),
    ('venue',                                  'Venue'),
    ('music',                                  'Music'),
    ('decorations',                            'Decorations'),
    ('photo',                                  'Photo'),
    ('decorators',                             'Decorators'),
    ('pandals-and-lightings',                  'Pandals and lightings'),
    ('soft-drinks',                            'Soft Drinks'),
    ('general-photographs',                    'General Photographs'),
    ('return-gifts',                           'Return Gifts'),
    ('foods',                                  'Foods'),
    ('dance-and-djs',                          'Dance & DJ’s'),
    ('stage-and-decorators',                   'Stage and decorators'),
    ('banner-printings-and-t-shirts-printers', 'Banner Printings & T-shirts printers'),
    ('costumes-providers',                     'Costumes providers'),
    ('prize-makers',                           'Prize makers'),
    ('open-grounds-and-auditorium-halls',      'Open Grounds and auditorium Hall’s'),
    ('photographers',                          'Photographers'),
    ('places',                                 'Places'),
    ('pandal-and-decorators',                  'Pandal and decorator’s'),
    ('djs-and-lightnings',                     'DJ’s and lightnings'),
    ('invitations-printers',                   'Invitations printers');

-- Services per category, with the verbatim source wording and the only two markers in the source.
INSERT INTO catalog.category_service (category_id, service_id, source_label, is_rental, is_optional, sort_order)
SELECT c.id, s.id, v.label, v.is_rental, v.is_optional, v.ord
FROM (VALUES
    ('weddings-and-reception',    'venues',                                 'Venues',                               false, false, 1),
    ('weddings-and-reception',    'photography',                            'Photography',                          false, false, 2),
    ('weddings-and-reception',    'wearables',                              'Wearables [Rental]',                   true,  false, 3),
    ('weddings-and-reception',    'makeup',                                 'Makeup',                               false, false, 4),
    ('weddings-and-reception',    'decoration',                             'Decoration',                           false, false, 5),
    ('weddings-and-reception',    'food',                                   'Food',                                 false, false, 6),
    ('weddings-and-reception',    'invitation-printers',                    'Invitation Printers',                  false, false, 7),
    ('weddings-and-reception',    'tent',                                   'Tent',                                 false, false, 8),
    ('weddings-and-reception',    'gifts',                                  'Gifts',                                false, false, 9),
    ('weddings-and-reception',    'music-and-djs',                          'Music & Dj’S',                         false, false, 10),
    ('weddings-and-reception',    'pandal-system',                          'Pandal System',                        false, false, 11),
    ('meetups-and-gatherings',    'venue',                                  'Venue',                                false, false, 1),
    ('meetups-and-gatherings',    'food',                                   'Food',                                 false, false, 2),
    ('meetups-and-gatherings',    'music',                                  'Music',                                false, false, 3),
    ('meetups-and-gatherings',    'decorations',                            'Decorations',                          false, false, 4),
    ('meetups-and-gatherings',    'gifts',                                  'Gifts',                                false, false, 5),
    ('meetups-and-gatherings',    'tent',                                   'Tent',                                 false, false, 6),
    ('meetups-and-gatherings',    'photo',                                  'Photo',                                false, false, 7),
    ('birthday-parties',          'venue',                                  'Venue',                                false, false, 1),
    ('birthday-parties',          'photography',                            'Photography',                          false, false, 2),
    ('birthday-parties',          'decorators',                             'Decorators',                           false, false, 3),
    ('birthday-parties',          'food',                                   'Food',                                 false, false, 4),
    ('birthday-parties',          'music',                                  'Music',                                false, false, 5),
    ('baby-shower',               'decorations',                            'Decorations',                          false, false, 1),
    ('baby-shower',               'makeup',                                 'Makeup',                               false, false, 2),
    ('baby-shower',               'venues',                                 'Venues',                               false, false, 3),
    ('baby-shower',               'pandals-and-lightings',                  'Pandals and lightings',                false, false, 4),
    ('baby-shower',               'food',                                   'Food',                                 false, false, 5),
    ('baby-shower',               'soft-drinks',                            'Soft Drinks',                          false, false, 6),
    ('baby-shower',               'general-photographs',                    'General Photographs',                  false, false, 7),
    ('baby-shower',               'return-gifts',                           'Return Gifts (optional)',              false, true,  8),
    ('college-and-school-events', 'pandal-system',                          'Pandal system',                        false, false, 1),
    ('college-and-school-events', 'foods',                                  'Foods',                                false, false, 2),
    ('college-and-school-events', 'dance-and-djs',                          'Dance & DJ’s',                         false, false, 3),
    ('college-and-school-events', 'stage-and-decorators',                   'Stage and decorators',                 false, false, 4),
    ('college-and-school-events', 'banner-printings-and-t-shirts-printers', 'Banner Printings & T-shirts printers', false, false, 5),
    ('college-and-school-events', 'costumes-providers',                     'Costumes providers',                   false, false, 6),
    ('college-and-school-events', 'prize-makers',                           'Prize makers',                         false, false, 7),
    ('college-and-school-events', 'open-grounds-and-auditorium-halls',      'Open Grounds and auditorium Hall’s',   false, false, 8),
    ('college-and-school-events', 'photographers',                          'Photographers',                        false, false, 9),
    ('outdoor-events',            'places',                                 'Places',                               false, false, 1),
    ('outdoor-events',            'pandal-and-decorators',                  'Pandal and decorator’s',               false, false, 2),
    ('outdoor-events',            'djs-and-lightnings',                     'DJ’s and lightnings',                  false, false, 3),
    ('outdoor-events',            'food',                                   'Food',                                 false, false, 4),
    ('outdoor-events',            'photography',                            'Photography',                          false, false, 5),
    ('outdoor-events',            'invitations-printers',                   'Invitations printers',                 false, false, 6)
) AS v (category_code, service_code, label, is_rental, is_optional, ord)
JOIN catalog.event_category c ON c.code = v.category_code
JOIN catalog.service s ON s.code = v.service_code;

-- Options (OPTION) and attributes (ATTRIBUTE) written after a dash or colon on a service line (A-04).
-- Attributes with no values in the source (Cost, Type, Customised) are stored as listed (D-11).
INSERT INTO catalog.service_option (category_service_id, kind, source_label, display_name, sort_order)
SELECT cs.id, v.kind, v.label, v.label, v.ord
FROM (VALUES
    ('weddings-and-reception', 'Venues',                'OPTION',    'choultry',                           1),
    ('weddings-and-reception', 'Venues',                'OPTION',    'halls',                              2),
    ('weddings-and-reception', 'Venues',                'OPTION',    'banquets',                           3),
    ('weddings-and-reception', 'Venues',                'ATTRIBUTE', 'Cost',                               4),
    ('weddings-and-reception', 'Venues',                'ATTRIBUTE', 'Type',                               5),
    ('weddings-and-reception', 'Photography',           'OPTION',    'pre-wedding',                        1),
    ('weddings-and-reception', 'Photography',           'OPTION',    'wedding',                            2),
    ('weddings-and-reception', 'Wearables [Rental]',    'OPTION',    'men and woman dress',                1),
    ('weddings-and-reception', 'Wearables [Rental]',    'OPTION',    'jewellery and accessories',          2),
    ('weddings-and-reception', 'Makeup',                'OPTION',    'hair stylist',                       1),
    ('weddings-and-reception', 'Makeup',                'OPTION',    'mehandi artist',                     2),
    ('weddings-and-reception', 'Makeup',                'OPTION',    'makeup',                             3),
    ('weddings-and-reception', 'Decoration',            'OPTION',    'Home',                               1),
    ('weddings-and-reception', 'Decoration',            'OPTION',    'Choultry',                           2),
    ('weddings-and-reception', 'Decoration',            'OPTION',    'Outdoor Wedding decos',              3),
    ('weddings-and-reception', 'Food',                  'OPTION',    'Veg',                                1),
    ('weddings-and-reception', 'Food',                  'OPTION',    'Non-Veg',                            2),
    ('weddings-and-reception', 'Food',                  'OPTION',    'Veg and Non-Veg(same/diff vendors)', 3),
    ('weddings-and-reception', 'Food',                  'OPTION',    'Chats and Bakeries',                 4),
    ('weddings-and-reception', 'Invitation Printers',   'ATTRIBUTE', 'Type',                               1),
    ('weddings-and-reception', 'Invitation Printers',   'ATTRIBUTE', 'Cost',                               2),
    ('weddings-and-reception', 'Invitation Printers',   'ATTRIBUTE', 'Customised',                         3),
    ('weddings-and-reception', 'Tent',                  'ATTRIBUTE', 'cost',                               1),
    ('weddings-and-reception', 'Tent',                  'ATTRIBUTE', 'type',                               2),
    ('birthday-parties',       'Venue',                 'OPTION',    'Party halls',                        1),
    ('baby-shower',            'Makeup',                'OPTION',    'Mehandhi',                           1),
    ('baby-shower',            'Makeup',                'OPTION',    'Jewelry',                            2),
    ('outdoor-events',         'Places',                'OPTION',    'Resorts',                            1),
    ('outdoor-events',         'Places',                'OPTION',    'open ground',                        2)
) AS v (category_code, service_label, kind, label, ord)
JOIN catalog.event_category c ON c.code = v.category_code
JOIN catalog.category_service cs ON cs.category_id = c.id AND cs.source_label = v.service_label;
