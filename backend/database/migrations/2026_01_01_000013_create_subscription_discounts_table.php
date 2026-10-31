<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_discounts', function (Blueprint $table) {
            $table->foreignId('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->foreignId('discount_id')->constrained('discounts')->restrictOnDelete();
            $table->timestamps();

            $table->primary(['subscription_id', 'discount_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_discounts');
    }
};
