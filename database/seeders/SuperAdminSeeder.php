<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update Super Admin user
        $user = User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'password' => bcrypt('password'), // Ganti dengan password yang aman
            ]
        );

        // Assign Super Admin role
        $superAdminRole = Role::where('name', 'Super Admin')->first();

        if ($superAdminRole) {
            $user->assignRole($superAdminRole);
            $this->command->info('Super Admin user created/updated and role assigned successfully.');
            $this->command->info('Email: superadmin@example.com');
            $this->command->info('Password: password');
        } else {
            $this->command->error('Super Admin role not found! Please run RoleSeeder first.');
        }
    }
}
