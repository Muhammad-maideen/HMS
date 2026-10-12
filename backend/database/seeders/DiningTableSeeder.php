<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use Illuminate\Database\Seeder;

class DiningTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tables = [
            ['code' => 'T-01', 'name' => 'Table 01', 'capacity' => 4, 'section' => 'Main Dining', 'status' => 'available'],
            ['code' => 'T-02', 'name' => 'Table 02', 'capacity' => 2, 'section' => 'Main Dining', 'status' => 'available'],
            ['code' => 'T-03', 'name' => 'Table 03', 'capacity' => 4, 'section' => 'Main Dining', 'status' => 'available'],
            ['code' => 'T-04', 'name' => 'Table 04', 'capacity' => 6, 'section' => 'Main Dining', 'status' => 'occupied'],
            ['code' => 'T-05', 'name' => 'Table 05', 'capacity' => 4, 'section' => 'Family AC', 'status' => 'available'],
            ['code' => 'T-06', 'name' => 'Table 06', 'capacity' => 6, 'section' => 'Family AC', 'status' => 'available'],
            ['code' => 'T-07', 'name' => 'Table 07', 'capacity' => 2, 'section' => 'Outdoor Terrace', 'status' => 'available'],
            ['code' => 'T-08', 'name' => 'Table 08', 'capacity' => 8, 'section' => 'VIP Lounge', 'status' => 'available'],
        ];

        foreach ($tables as $t) {
            DiningTable::firstOrCreate(['code' => $t['code']], $t);
        }
    }
}
