<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Combo;
use App\Models\ComboItem;
use App\Models\Offer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MenuManagementSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categories
        $categoriesData = [
            [
                'name' => 'Signature Biryanis',
                'slug' => 'signature-biryanis',
                'description' => 'Slow-cooked Dum Biryanis made with aged Basmati and royal spices.',
                'image' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Tandoori & Starters',
                'slug' => 'tandoori-starters',
                'description' => 'Crispy, smoky charcoal-grilled appetizers and signature starters.',
                'image' => 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Royal Gravies & Curries',
                'slug' => 'royal-gravies-curries',
                'description' => 'Rich, aromatic Mughlai and Awadhi curries simmered in copper vessels.',
                'image' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Artisan Breads',
                'slug' => 'artisan-breads',
                'description' => 'Fresh tandoori rotis, flaky parathas, and butter-brushed naans.',
                'image' => 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Mughlai Desserts',
                'slug' => 'mughlai-desserts',
                'description' => 'Traditional saffron-infused sweets and chilled royal delicacies.',
                'image' => 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Beverages & Mocktails',
                'slug' => 'beverages-mocktails',
                'description' => 'Refreshing royal coolers, fresh mint infusions, and thick lassis.',
                'image' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
                'is_active' => true,
                'sort_order' => 6,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = Category::create($c);
        }

        // 2. Products
        $productsData = [
            // Biryanis
            [
                'category_id' => $categories['signature-biryanis']->id,
                'name' => 'Chicken Dum Biryani',
                'slug' => 'chicken-dum-biryani',
                'sku' => 'AR-BRY-001',
                'description' => 'Tender chicken marinated overnight in secret 32-spice blend, dum-cooked with long-grain aged Basmati rice and pure desi ghee.',
                'base_price' => 180.00,
                'offer_price' => 149.00,
                'dine_in_price' => 180.00,
                'takeaway_price' => 170.00,
                'delivery_price' => 195.00,
                'is_featured' => true,
                'is_bestseller' => true,
                'is_new_arrival' => false,
                'is_todays_special' => true,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 120,
                'image_url' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Half Biryani', 'sku' => 'AR-BRY-001-H', 'regular_price' => 110.00, 'offer_price' => 99.00, 'dine_in_price' => 110, 'takeaway_price' => 105, 'delivery_price' => 120, 'is_available' => true],
                    ['variant_name' => 'Full Biryani', 'sku' => 'AR-BRY-001-F', 'regular_price' => 180.00, 'offer_price' => 149.00, 'dine_in_price' => 180, 'takeaway_price' => 170, 'delivery_price' => 195, 'is_available' => true],
                    ['variant_name' => 'Family Pack (Serves 4)', 'sku' => 'AR-BRY-001-FP', 'regular_price' => 490.00, 'offer_price' => 420.00, 'dine_in_price' => 490, 'takeaway_price' => 470, 'delivery_price' => 520, 'is_available' => true],
                ],
            ],
            [
                'category_id' => $categories['signature-biryanis']->id,
                'name' => 'Mutton Zafrani Biryani',
                'slug' => 'mutton-zafrani-biryani',
                'sku' => 'AR-BRY-002',
                'description' => 'Succulent baby goat meat infused with Kashmiri saffron, caramelized onions, and royal spices simmered in clay handi.',
                'base_price' => 250.00,
                'offer_price' => 219.00,
                'dine_in_price' => 250.00,
                'takeaway_price' => 240.00,
                'delivery_price' => 270.00,
                'is_featured' => true,
                'is_bestseller' => true,
                'is_new_arrival' => false,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 75,
                'image_url' => 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Half Biryani', 'sku' => 'AR-BRY-002-H', 'regular_price' => 160.00, 'offer_price' => 145.00, 'dine_in_price' => 160, 'takeaway_price' => 155, 'delivery_price' => 175, 'is_available' => true],
                    ['variant_name' => 'Full Biryani', 'sku' => 'AR-BRY-002-F', 'regular_price' => 250.00, 'offer_price' => 219.00, 'dine_in_price' => 250, 'takeaway_price' => 240, 'delivery_price' => 270, 'is_available' => true],
                    ['variant_name' => 'Handi Special (Serves 3)', 'sku' => 'AR-BRY-002-HD', 'regular_price' => 680.00, 'offer_price' => 599.00, 'dine_in_price' => 680, 'takeaway_price' => 650, 'delivery_price' => 720, 'is_available' => true],
                ],
            ],
            // Starters
            [
                'category_id' => $categories['tandoori-starters']->id,
                'name' => 'Chicken 65 Crispy',
                'slug' => 'chicken-65-crispy',
                'sku' => 'AR-STR-001',
                'description' => 'Crispy fried boneless chicken tossed with curry leaves, crushed black pepper, green chilies, and tangy yogurt dressing.',
                'base_price' => 160.00,
                'offer_price' => 129.00,
                'dine_in_price' => 160.00,
                'takeaway_price' => 150.00,
                'delivery_price' => 175.00,
                'is_featured' => true,
                'is_bestseller' => true,
                'is_new_arrival' => false,
                'is_todays_special' => true,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 90,
                'image_url' => 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Half Plate (4 Pcs)', 'sku' => 'AR-STR-001-H', 'regular_price' => 110.00, 'offer_price' => 99.00, 'dine_in_price' => 110, 'takeaway_price' => 105, 'delivery_price' => 120, 'is_available' => true],
                    ['variant_name' => 'Full Plate (8 Pcs)', 'sku' => 'AR-STR-001-F', 'regular_price' => 160.00, 'offer_price' => 129.00, 'dine_in_price' => 160, 'takeaway_price' => 150, 'delivery_price' => 175, 'is_available' => true],
                ],
            ],
            [
                'category_id' => $categories['tandoori-starters']->id,
                'name' => 'Paneer Tikka Angara',
                'slug' => 'paneer-tikka-angara',
                'sku' => 'AR-STR-002',
                'description' => 'Fresh cottage cheese cubes marinated in smoked hung curd, carom seeds, and mustard oil, grilled in clay tandoor.',
                'base_price' => 170.00,
                'offer_price' => 145.00,
                'dine_in_price' => 170.00,
                'takeaway_price' => 160.00,
                'delivery_price' => 185.00,
                'is_featured' => false,
                'is_bestseller' => false,
                'is_new_arrival' => true,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 60,
                'image_url' => 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Half (4 Pcs)', 'sku' => 'AR-STR-002-H', 'regular_price' => 120.00, 'offer_price' => 110.00, 'dine_in_price' => 120, 'takeaway_price' => 115, 'delivery_price' => 130, 'is_available' => true],
                    ['variant_name' => 'Full (8 Pcs)', 'sku' => 'AR-STR-002-F', 'regular_price' => 170.00, 'offer_price' => 145.00, 'dine_in_price' => 170, 'takeaway_price' => 160, 'delivery_price' => 185, 'is_available' => true],
                ],
            ],
            // Curries
            [
                'category_id' => $categories['royal-gravies-curries']->id,
                'name' => 'Butter Chicken Delhi Style',
                'slug' => 'butter-chicken-delhi-style',
                'sku' => 'AR-GRV-001',
                'description' => 'Charcoal-grilled tandoori chicken cooked in silky smooth tomato, butter, and cashew nut gravy finished with fresh cream.',
                'base_price' => 230.00,
                'offer_price' => 199.00,
                'dine_in_price' => 230.00,
                'takeaway_price' => 220.00,
                'delivery_price' => 245.00,
                'is_featured' => true,
                'is_bestseller' => true,
                'is_new_arrival' => false,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 80,
                'image_url' => 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Half Handi', 'sku' => 'AR-GRV-001-H', 'regular_price' => 160.00, 'offer_price' => 149.00, 'dine_in_price' => 160, 'takeaway_price' => 155, 'delivery_price' => 170, 'is_available' => true],
                    ['variant_name' => 'Full Handi', 'sku' => 'AR-GRV-001-F', 'regular_price' => 230.00, 'offer_price' => 199.00, 'dine_in_price' => 230, 'takeaway_price' => 220, 'delivery_price' => 245, 'is_available' => true],
                ],
            ],
            [
                'category_id' => $categories['royal-gravies-curries']->id,
                'name' => 'Mutton Rogan Josh',
                'slug' => 'mutton-rogan-josh',
                'sku' => 'AR-GRV-002',
                'description' => 'Slow-braised lamb shanks in rich gravy spiced with Kashmiri dry red chilies, fennel seed, and dry ginger powder.',
                'base_price' => 280.00,
                'offer_price' => 240.00,
                'dine_in_price' => 280.00,
                'takeaway_price' => 270.00,
                'delivery_price' => 295.00,
                'is_featured' => false,
                'is_bestseller' => false,
                'is_new_arrival' => true,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 50,
                'image_url' => 'https://images.unsplash.com/photo-1545247181-516773ca838b?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Half Handi', 'sku' => 'AR-GRV-002-H', 'regular_price' => 190.00, 'offer_price' => 175.00, 'dine_in_price' => 190, 'takeaway_price' => 180, 'delivery_price' => 200, 'is_available' => true],
                    ['variant_name' => 'Full Handi', 'sku' => 'AR-GRV-002-F', 'regular_price' => 280.00, 'offer_price' => 240.00, 'dine_in_price' => 280, 'takeaway_price' => 270, 'delivery_price' => 295, 'is_available' => true],
                ],
            ],
            // Breads
            [
                'category_id' => $categories['artisan-breads']->id,
                'name' => 'Garlic Butter Naan',
                'slug' => 'garlic-butter-naan',
                'sku' => 'AR-BRD-001',
                'description' => 'Tandoor-baked leavened bread generously topped with minced roasted garlic, fresh coriander, and melted Amul butter.',
                'base_price' => 55.00,
                'offer_price' => 45.00,
                'dine_in_price' => 55.00,
                'takeaway_price' => 50.00,
                'delivery_price' => 60.00,
                'is_featured' => false,
                'is_bestseller' => true,
                'is_new_arrival' => false,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 200,
                'image_url' => 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Single Naan', 'sku' => 'AR-BRD-001-S', 'regular_price' => 55.00, 'offer_price' => 45.00, 'dine_in_price' => 55, 'takeaway_price' => 50, 'delivery_price' => 60, 'is_available' => true],
                    ['variant_name' => 'Basket (3 Pcs)', 'sku' => 'AR-BRD-001-B', 'regular_price' => 140.00, 'offer_price' => 120.00, 'dine_in_price' => 140, 'takeaway_price' => 130, 'delivery_price' => 150, 'is_available' => true],
                ],
            ],
            // Desserts
            [
                'category_id' => $categories['mughlai-desserts']->id,
                'name' => 'Shahi Gulab Jamun (2 Pcs)',
                'slug' => 'shahi-gulab-jamun',
                'sku' => 'AR-DST-001',
                'description' => 'Mawa dumplings fried in pure ghee, soaked in rose cardamom sugar syrup, garnished with slivered pistachios.',
                'base_price' => 80.00,
                'offer_price' => 65.00,
                'dine_in_price' => 80.00,
                'takeaway_price' => 75.00,
                'delivery_price' => 85.00,
                'is_featured' => false,
                'is_bestseller' => true,
                'is_new_arrival' => false,
                'is_todays_special' => true,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 95,
                'image_url' => 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => '2 Pieces', 'sku' => 'AR-DST-001-2', 'regular_price' => 80.00, 'offer_price' => 65.00, 'dine_in_price' => 80, 'takeaway_price' => 75, 'delivery_price' => 85, 'is_available' => true],
                    ['variant_name' => 'Family (4 Pcs)', 'sku' => 'AR-DST-001-4', 'regular_price' => 150.00, 'offer_price' => 120.00, 'dine_in_price' => 150, 'takeaway_price' => 140, 'delivery_price' => 160, 'is_available' => true],
                ],
            ],
            // Beverages
            [
                'category_id' => $categories['beverages-mocktails']->id,
                'name' => 'Royal Mango Lassi',
                'slug' => 'royal-mango-lassi',
                'sku' => 'AR-BEV-001',
                'description' => 'Thick yogurt shake blended with Alphonso mango pulp, saffron strands, and crushed almonds.',
                'base_price' => 70.00,
                'offer_price' => 55.00,
                'dine_in_price' => 70.00,
                'takeaway_price' => 65.00,
                'delivery_price' => 75.00,
                'is_featured' => false,
                'is_bestseller' => true,
                'is_new_arrival' => false,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 110,
                'image_url' => 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80',
                'variants' => [
                    ['variant_name' => 'Regular (300ml)', 'sku' => 'AR-BEV-001-R', 'regular_price' => 70.00, 'offer_price' => 55.00, 'dine_in_price' => 70, 'takeaway_price' => 65, 'delivery_price' => 75, 'is_available' => true],
                    ['variant_name' => 'Large (500ml)', 'sku' => 'AR-BEV-001-L', 'regular_price' => 110.00, 'offer_price' => 95.00, 'dine_in_price' => 110, 'takeaway_price' => 100, 'delivery_price' => 120, 'is_available' => true],
                ],
            ],
            // Out of stock product sample
            [
                'category_id' => $categories['signature-biryanis']->id,
                'name' => 'Special Hyderabadi Haleem',
                'slug' => 'special-hyderabadi-haleem',
                'sku' => 'AR-SP-001',
                'description' => 'Seasonal stew of broken wheat, lentils, and slow-pounded mutton simmered for 8 hours with fragrant spices.',
                'base_price' => 220.00,
                'offer_price' => 199.00,
                'dine_in_price' => 220.00,
                'takeaway_price' => 210.00,
                'delivery_price' => 230.00,
                'is_featured' => true,
                'is_bestseller' => false,
                'is_new_arrival' => false,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => false, // Out of stock!
                'stock_quantity' => 0,
                'image_url' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
                'variants' => [],
            ],
            // Another side dish
            [
                'category_id' => $categories['signature-biryanis']->id,
                'name' => 'Special Boondi Raita',
                'slug' => 'special-boondi-raita',
                'sku' => 'AR-SD-001',
                'description' => 'Chilled spiced yogurt topped with crispy gram flour pearls, roasted cumin, and mint.',
                'base_price' => 40.00,
                'offer_price' => 30.00,
                'dine_in_price' => 40.00,
                'takeaway_price' => 35.00,
                'delivery_price' => 45.00,
                'is_featured' => false,
                'is_bestseller' => false,
                'is_new_arrival' => false,
                'is_todays_special' => false,
                'is_active' => true,
                'is_available' => true,
                'stock_quantity' => 150,
                'image_url' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
                'variants' => [],
            ]
        ];

        $createdProducts = [];
        foreach ($productsData as $prod) {
            $variants = $prod['variants'] ?? [];
            unset($prod['variants']);

            $product = Product::create($prod);
            $createdProducts[$product->slug] = $product;

            // Product Images
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $product->image_url,
                'original_name' => $product->slug . '.jpg',
                'file_size_kb' => rand(150, 480),
                'is_primary' => true,
                'sort_order' => 1,
            ]);

            // Variants
            foreach ($variants as $v) {
                ProductVariant::create(array_merge($v, ['product_id' => $product->id]));
            }
        }

        // 3. Offers
        $now = Carbon::now();
        Offer::create([
            'title' => 'Royal Feast 20% OFF',
            'code' => 'ROYAL20',
            'description' => 'Enjoy 20% flat discount on all bill amounts above ₹400 across the entire menu.',
            'discount_type' => 'percentage',
            'discount_value' => 20.00,
            'min_order_amount' => 400.00,
            'max_discount_amount' => 120.00,
            'start_time' => $now->copy()->subDays(5),
            'end_time' => $now->copy()->addDays(20),
            'badge_text' => '20% OFF',
            'target_type' => 'all',
            'is_active' => true,
        ]);

        Offer::create([
            'title' => 'Flat ₹50 Super Saver',
            'code' => 'FLAT50',
            'description' => 'Get instant flat ₹50 OFF on orders with minimum cart value of ₹300.',
            'discount_type' => 'fixed',
            'discount_value' => 50.00,
            'min_order_amount' => 300.00,
            'max_discount_amount' => null,
            'start_time' => $now->copy()->subDays(2),
            'end_time' => $now->copy()->addDays(15),
            'badge_text' => '₹50 OFF',
            'target_type' => 'all',
            'is_active' => true,
        ]);

        Offer::create([
            'title' => 'Biryani Festival Special 15%',
            'code' => 'BIRYANI15',
            'description' => '15% discount exclusively on our Signature Biryanis category with min spend of ₹250.',
            'discount_type' => 'percentage',
            'discount_value' => 15.00,
            'min_order_amount' => 250.00,
            'max_discount_amount' => 90.00,
            'start_time' => $now->copy()->subDays(1),
            'end_time' => $now->copy()->addDays(10),
            'badge_text' => '15% OFF BIRYANI',
            'target_type' => 'category',
            'target_ids' => [$categories['signature-biryanis']->id],
            'is_active' => true,
        ]);

        // Scheduled future offer
        Offer::create([
            'title' => 'Diwali Mega Feast 25%',
            'code' => 'DIWALI25',
            'description' => 'Upcoming holiday special discount starting next week.',
            'discount_type' => 'percentage',
            'discount_value' => 25.00,
            'min_order_amount' => 600.00,
            'max_discount_amount' => 200.00,
            'start_time' => $now->copy()->addDays(5),
            'end_time' => $now->copy()->addDays(15),
            'badge_text' => 'UPCOMING 25%',
            'target_type' => 'all',
            'is_active' => true,
        ]);

        // Expired offer
        Offer::create([
            'title' => 'Early Bird Launch Promo',
            'code' => 'EARLYBIRD',
            'description' => 'Expired launch promotion for auditing and expiry testing.',
            'discount_type' => 'percentage',
            'discount_value' => 30.00,
            'min_order_amount' => 200.00,
            'max_discount_amount' => 100.00,
            'start_time' => $now->copy()->subDays(30),
            'end_time' => $now->copy()->subDays(10),
            'badge_text' => 'EXPIRED',
            'target_type' => 'all',
            'is_active' => true,
        ]);

        // 4. Combos (Example from Prompt: Chicken Biryani + Chicken 65 + Raita + Sweet = Reg 300, Combo 249, Save 51)
        $cb1 = Combo::create([
            'name' => 'Elite Biryani Royal Combo',
            'slug' => 'elite-biryani-royal-combo',
            'description' => 'Our flagship meal deal: 1 Chicken Biryani, 1 Chicken 65 portion, 1 Special Boondi Raita, and 1 Shahi Gulab Jamun sweet.',
            'image_url' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
            'regular_price' => 300.00,
            'combo_price' => 249.00,
            'customer_savings' => 51.00,
            'badge_text' => 'Save ₹51',
            'is_active' => true,
            'is_available' => true,
            'start_date' => $now->copy()->subDays(10),
            'end_date' => $now->copy()->addDays(60),
        ]);

        ComboItem::create([
            'combo_id' => $cb1->id,
            'product_id' => $createdProducts['chicken-dum-biryani']->id,
            'quantity' => 1,
            'is_optional' => false,
            'substitution_notes' => null,
        ]);
        ComboItem::create([
            'combo_id' => $cb1->id,
            'product_id' => $createdProducts['chicken-65-crispy']->id,
            'quantity' => 1,
            'is_optional' => false,
            'substitution_notes' => null,
        ]);
        ComboItem::create([
            'combo_id' => $cb1->id,
            'product_id' => $createdProducts['special-boondi-raita']->id,
            'quantity' => 1,
            'is_optional' => true,
            'substitution_notes' => 'Can substitute with Mirchi Ka Salan or Salad',
        ]);
        ComboItem::create([
            'combo_id' => $cb1->id,
            'product_id' => $createdProducts['shahi-gulab-jamun']->id,
            'quantity' => 1,
            'is_optional' => false,
            'substitution_notes' => null,
        ]);

        // Combo 2
        $cb2 = Combo::create([
            'name' => 'Nawabi Feast for Two',
            'slug' => 'nawabi-feast-for-two',
            'description' => 'Deluxe pair platter: 1 Mutton Zafrani Biryani, 1 Chicken 65 Crispy, 2 Garlic Butter Naans, and 2 Royal Mango Lassis.',
            'image_url' => 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80',
            'regular_price' => 550.00,
            'combo_price' => 459.00,
            'customer_savings' => 91.00,
            'badge_text' => 'Save ₹91',
            'is_active' => true,
            'is_available' => true,
            'start_date' => $now->copy()->subDays(5),
            'end_date' => $now->copy()->addDays(90),
        ]);

        ComboItem::create([
            'combo_id' => $cb2->id,
            'product_id' => $createdProducts['mutton-zafrani-biryani']->id,
            'quantity' => 1,
        ]);
        ComboItem::create([
            'combo_id' => $cb2->id,
            'product_id' => $createdProducts['chicken-65-crispy']->id,
            'quantity' => 1,
        ]);
        ComboItem::create([
            'combo_id' => $cb2->id,
            'product_id' => $createdProducts['garlic-butter-naan']->id,
            'quantity' => 2,
        ]);
        ComboItem::create([
            'combo_id' => $cb2->id,
            'product_id' => $createdProducts['royal-mango-lassi']->id,
            'quantity' => 2,
        ]);

        // 5. Completed Orders (Sample historical data to prove past bills remain frozen)
        $ord1 = Order::create([
            'order_number' => 'ORD-20261001-0082',
            'order_type' => 'dine_in',
            'table_number' => 'T-04',
            'customer_name' => 'Rahim Khan',
            'customer_phone' => '+91 98765 43210',
            'subtotal' => 340.00,
            'discount_total' => 62.00,
            'applied_offer_id' => 1,
            'applied_offer_code' => 'ROYAL20',
            'tax_amount' => 13.90,
            'final_total' => 291.90,
            'payment_method' => 'upi',
            'payment_status' => 'paid',
            'order_status' => 'completed',
            'created_by_role' => 'cashier',
            'created_at' => $now->copy()->subDays(3),
        ]);

        OrderItem::create([
            'order_id' => $ord1->id,
            'product_id' => $createdProducts['chicken-dum-biryani']->id,
            'item_type' => 'product',
            'item_name' => 'Chicken Dum Biryani',
            'variant_name' => 'Full Biryani',
            'unit_price' => 180.00,
            'offer_price' => 149.00,
            'discount_amount' => 31.00,
            'quantity' => 1,
            'line_total' => 149.00,
        ]);

        OrderItem::create([
            'order_id' => $ord1->id,
            'product_id' => $createdProducts['chicken-65-crispy']->id,
            'item_type' => 'product',
            'item_name' => 'Chicken 65 Crispy',
            'variant_name' => null,
            'unit_price' => 160.00,
            'offer_price' => 129.00,
            'discount_amount' => 31.00,
            'quantity' => 1,
            'line_total' => 129.00,
        ]);
    }
}
