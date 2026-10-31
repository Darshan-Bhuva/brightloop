<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->decimal('price', 12, 2);
            $table->string('billing_period', 20)->index();
            $table->unsignedInteger('min_quantity')->default(1);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->foreignId('tax_id')->nullable()->constrained('taxes')->nullOnDelete();
            $table->boolean('auto_close')->default(false);
            $table->boolean('closable')->default(true);
            $table->boolean('pausable')->default(false);
            $table->boolean('renewable')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
