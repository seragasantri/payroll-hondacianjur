<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();


        $this->call([
            UserSeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class
        ]);

        $superadmin =  User::create([
            'name' => 'Test User',
            'username' => 'sa',
            'password' => Hash::make('1')
        ]);

        $superadmin->assignRole('Super Admin');
    }
}
