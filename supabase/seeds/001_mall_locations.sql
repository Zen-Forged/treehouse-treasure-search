-- ============================================================
-- Treehouse Finds — Mall seed data
-- Run in Supabase SQL editor. Safe to re-run (upserts by slug).
-- ============================================================

ALTER TABLE malls ADD COLUMN IF NOT EXISTS phone        text;
ALTER TABLE malls ADD COLUMN IF NOT EXISTS website      text;
ALTER TABLE malls ADD COLUMN IF NOT EXISTS google_maps_url text;
ALTER TABLE malls ADD COLUMN IF NOT EXISTS latitude     numeric(10,7);
ALTER TABLE malls ADD COLUMN IF NOT EXISTS longitude    numeric(10,7);
ALTER TABLE malls ADD COLUMN IF NOT EXISTS category     text;
ALTER TABLE malls ADD COLUMN IF NOT EXISTS zip_code     text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'malls_slug_key') THEN
    ALTER TABLE malls ADD CONSTRAINT malls_slug_key UNIQUE (slug);
  END IF;
END$$;

INSERT INTO malls (name, address, city, state, zip_code, phone, website, google_maps_url, latitude, longitude, category, slug)
VALUES
  ('Winchester Peddlers Mall','110 Shoppers Village Dr, Winchester, KY 40391','Winchester','KY','40391','+18597372700','http://buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=110%20Shoppers%20Village%20Dr%2C%20Winchester%2C%20KY%2040391',38.0057827,-84.2132229,'peddlers_mall','winchester-peddlers-mall'),
  ('Shelby County Flea Market','820 Buck Creek Rd, Suite E, Simpsonville, KY 40067','Simpsonville','KY','40067','+15027228883','https://fleamarkets.website/kentucky/58-shelby-county-flea-market?ic=1','https://www.google.com/maps/search/?api=1&query=820%20Buck%20Creek%20Rd%2C%20Suite%20E%2C%20Simpsonville%2C%20KY%2040067',38.208294,-85.3431417,'flea_market','shelby-county-flea-market'),
  ('Awesome Flea Market','165 Dawson Dr, Shepherdsville, KY 40165','Shepherdsville','KY','40165','+15025437899','https://www.awesomefleamarket.com/','https://www.google.com/maps/search/?api=1&query=165%20Dawson%20Dr%2C%20Shepherdsville%2C%20KY%2040165',37.9815594,-85.702761,'flea_market','awesome-flea-market'),
  ('Big Time Bargains FLEA MARKET','166 Midland Blvd, Shelbyville, KY 40065','Shelbyville','KY','40065','+15026471050',NULL,'https://www.google.com/maps/search/?api=1&query=166%20Midland%20Blvd%2C%20Shelbyville%2C%20KY%2040065',38.2149345,-85.2537534,'flea_market','big-time-bargains-flea-market'),
  ('Richmond Peddlers Mall','449 Eastern Bypass, Richmond, KY 40475','Richmond','KY','40475','+18596260688','http://buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=449%20Eastern%20Bypass%2C%20Richmond%2C%20KY%2040475',37.7376838,-84.3102319,'peddlers_mall','richmond-peddlers-mall'),
  ('Morehead Peddlers Mall','300 Pine Crest Road, Morehead, KY 40351','Morehead','KY','40351','+16067841695','http://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=300%20Pine%20Crest%20Road%2C%20Morehead%2C%20KY%2040351',38.189638,-83.4805024,'peddlers_mall','morehead-peddlers-mall'),
  ('Middletown Peddler''s Mall','12405 Shelbyville Rd, Louisville, KY 40243','Louisville','KY','40243','+15022457705','http://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=12405%20Shelbyville%20Rd%2C%20Louisville%2C%20KY%2040243',38.2465783,-85.522382,'peddlers_mall','middletown-peddlers-mall'),
  ('The Antique Market','519 Barret Ave, Louisville, KY 40204','Louisville','KY','40204','+15025835510','http://theantiquemarketky.com/','https://www.google.com/maps/search/?api=1&query=519%20Barret%20Ave%2C%20Louisville%2C%20KY%2040204',38.2469441,-85.7307376,'antique_mall','the-antique-market'),
  ('Tickled Pink Memorabilia Mall','3269 Taylor Blvd, Louisville, KY 40215','Louisville','KY','40215','+15023665577','https://m.facebook.com/tickledpinkmall/','https://www.google.com/maps/search/?api=1&query=3269%20Taylor%20Blvd%2C%20Louisville%2C%20KY%2040215',38.2027768,-85.7802497,'antique_store','tickled-pink-memorabilia-mall'),
  ('Mellwood Antiques & Interiors','1860 Mellwood Ave, Louisville, KY 40206','Louisville','KY','40206','+15028951306','http://mellwoodantiques.com/','https://www.google.com/maps/search/?api=1&query=1860%20Mellwood%20Ave%2C%20Louisville%2C%20KY%2040206',38.2622807,-85.7134935,'antique_mall','mellwood-antiques-interiors'),
  ('Hillview Peddler''s Mall','11310 Preston Hwy, Louisville, KY 40229','Louisville','KY','40229','+15029640077','https://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=11310%20Preston%20Hwy%2C%20Louisville%2C%20KY%2040229',38.0849573,-85.6703763,'peddlers_mall','hillview-peddlers-mall'),
  ('White Elephant Vendors Market','8523 Terry Rd, Louisville, KY 40258','Louisville','KY','40258','+15023651214','https://www.facebook.com/White-Elephant-Vendors-Market-LLC-498045560248779/','https://www.google.com/maps/search/?api=1&query=8523%20Terry%20Rd%2C%20Louisville%2C%20KY%2040258',38.1296094,-85.8729927,'peddlers_mall','white-elephant-vendors-market'),
  ('Outer Loop Peddlers Mall','5718 Outer Loop, Louisville, KY 40219','Louisville','KY','40219','+15029683600','http://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=5718%20Outer%20Loop%2C%20Louisville%2C%20KY%2040219',38.1369739,-85.6546457,'peddlers_mall','outer-loop-peddlers-mall'),
  ('Fleur De Flea Vintage Market','947 E Breckinridge St, Louisville, KY 40204','Louisville','KY','40204','+15023653563','https://www.thefleurdeflea.com/','https://www.google.com/maps/search/?api=1&query=947%20E%20Breckinridge%20St%2C%20Louisville%2C%20KY%2040204',38.239881,-85.7367376,'flea_market','fleur-de-flea-vintage-market'),
  ('Kentucky Flea Market','937 Phillips Ln, Louisville, KY 40209','Louisville','KY','40209','+15024562244','http://www.stewartpromotions.com/','https://www.google.com/maps/search/?api=1&query=937%20Phillips%20Ln%2C%20Louisville%2C%20KY%2040209',38.1995169,-85.7419677,'flea_market','kentucky-flea-market'),
  ('Derby Park Flea Market','2900 7th Street Rd, Louisville, KY 40216','Louisville','KY','40216','+15026363532','https://derbyparkfleamarket.com/','https://www.google.com/maps/search/?api=1&query=2900%207th%20Street%20Rd%2C%20Louisville%2C%20KY%2040216',38.2104557,-85.788584,'flea_market','derby-park-flea-market'),
  ('Louisville Antique Market','845 E Jefferson St, Louisville, KY 40206','Louisville','KY','40206','+15022170085','http://louisvilleantiquemarket.com/','https://www.google.com/maps/search/?api=1&query=845%20E%20Jefferson%20St%2C%20Louisville%2C%20KY%2040206',38.251985,-85.7363622,'antique_market','louisville-antique-market'),
  ('New Cut Peddlers Mall','191 Outer Loop, Louisville, KY 40214','Louisville','KY','40214','+15023330207','https://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=191%20Outer%20Loop%2C%20Louisville%2C%20KY%2040214',38.127757,-85.7773105,'peddlers_mall','new-cut-peddlers-mall'),
  ('Mall St. Matthews','5000 Shelbyville Rd, Louisville, KY 40207','Louisville','KY','40207','+15028930312','https://www.mallstmatthews.com/en.html','https://www.google.com/maps/search/?api=1&query=5000%20Shelbyville%20Rd%2C%20Louisville%2C%20KY%2040207',38.2468253,-85.6223271,'peddlers_mall','mall-st-matthews'),
  ('All Peddlers','7100 Preston Hwy, #108, Louisville, KY 40219','Louisville','KY','40219','+15029665880',NULL,'https://www.google.com/maps/search/?api=1&query=7100%20Preston%20Hwy%2C%20%23108%2C%20Louisville%2C%20KY%2040219',38.148777,-85.6942138,'peddlers_mall','all-peddlers'),
  ('East Lexington Peddlers Mall','1205 E New Circle Rd, Lexington, KY 40505','Lexington','KY','40505','+18592460028','https://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=1205%20E%20New%20Circle%20Rd%2C%20Lexington%2C%20KY%2040505',38.0320456,-84.452282,'peddlers_mall','east-lexington-peddlers-mall'),
  ('Traderbaker Malls LLC','406 S 1st St, La Grange, KY 40031','La Grange','KY','40031','+15022259802','http://traderbaker-llc.poi.place/','https://www.google.com/maps/search/?api=1&query=406%20S%201st%20St%2C%20La%20Grange%2C%20KY%2040031',38.4050095,-85.3764721,'flea_market','traderbaker-malls-llc'),
  ('Georgetown Peddlers Mall','401 Outlet Center Dr, #270, Georgetown, KY 40324','Georgetown','KY','40324','+15028686888','http://buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=401%20Outlet%20Center%20Dr%2C%20%23270%2C%20Georgetown%2C%20KY%2040324',38.2180718,-84.5375564,'peddlers_mall','georgetown-peddlers-mall'),
  ('Frankfort Peddlers Mall','312 Versailles Rd, Frankfort, KY 40601','Frankfort','KY','40601','+15026955772','https://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=312%20Versailles%20Rd%2C%20Frankfort%2C%20KY%2040601',38.1985798,-84.8294619,'peddlers_mall','frankfort-peddlers-mall'),
  ('Elizabethtown Peddlers Mall','1111 N Dixie Hwy, Elizabethtown, KY 42701','Elizabethtown','KY','42701','+12707636858','http://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=1111%20N%20Dixie%20Hwy%2C%20Elizabethtown%2C%20KY%2042701',37.7171123,-85.8759681,'peddlers_mall','elizabethtown-peddlers-mall'),
  ('Crestwood Merchantile','6541 KY-22, Crestwood, KY 40014','Crestwood','KY','40014','+15028078241','https://www.crestwoodmercantile.com/','https://www.google.com/maps/search/?api=1&query=6541%20KY-22%2C%20Crestwood%2C%20KY%2040014',38.3247204,-85.4718971,'peddlers_mall','crestwood-merchantile'),
  ('Clarksville Peddlers Mall','1416 Blackiston Mill Rd, Clarksville, IN 47129','Clarksville','IN','47129','+18122833211','http://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=1416%20Blackiston%20Mill%20Rd%2C%20Clarksville%2C%20IN%2047129',38.3137329,-85.7690675,'peddlers_mall','clarksville-peddlers-mall'),
  ('Bardstown Peddlers Mall','1020 Granite Dr, Bardstown, KY 40004','Bardstown','KY','40004','+15023481202','http://www.buypeddlersmall.com/','https://www.google.com/maps/search/?api=1&query=1020%20Granite%20Dr%2C%20Bardstown%2C%20KY%2040004',37.8200697,-85.4282421,'peddlers_mall','bardstown-peddlers-mall'),
  ('America''s Antique Mall','5252 Bardstown Rd, Louisville, KY 40291','Louisville','KY','40291','+15023652715','https://www.americasantiquemall.com/louisville-ky/louisville-vendors','https://www.google.com/maps/search/?api=1&query=5252%20Bardstown%20Rd%2C%20Louisville%2C%20KY%2040291',38.168005,-85.6072654,'peddlers_mall','americas-antique-mall')
ON CONFLICT (slug) DO UPDATE SET
  address         = EXCLUDED.address,
  phone           = EXCLUDED.phone,
  website         = EXCLUDED.website,
  google_maps_url = EXCLUDED.google_maps_url,
  latitude        = EXCLUDED.latitude,
  longitude       = EXCLUDED.longitude,
  category        = EXCLUDED.category,
  zip_code        = EXCLUDED.zip_code;

SELECT id, name, city, state, category, slug FROM malls ORDER BY name;
