<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('code', 50)->nullable()->unique();
            $table->string('type', 20);
            $table->decimal('value', 12, 2);
            $table->string('applies_to', 20);
            $table->decimal('min_purchase', 12, 2)->nullable();
            $table->unsignedInteger('min_quantity')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
