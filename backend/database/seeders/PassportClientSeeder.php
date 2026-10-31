<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;

class PassportClientSeeder extends Seeder
{
    public const NAME = 'Brightloop Personal Access Client';

    public const PROVIDER = 'users';

    /**
     * Ensure the personal access client used by createToken() exists (idempotent).
     */
    public function run(ClientRepository $clients): void
    {
        $exists = Passport::client()->newQuery()
            ->where('name', self::NAME)
            ->where('provider', self::PROVIDER)
            ->where('revoked', false)
            ->exists();

        if (! $exists) {
            $clients->createPersonalAccessGrantClient(self::NAME, self::PROVIDER);
        }
    }
}
