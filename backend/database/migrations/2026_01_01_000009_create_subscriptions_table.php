<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->nullable()->unique();
            $table->foreignId('customer_id')->index()->constrained('customers')->restrictOnDelete();
            $table->foreignId('plan_id')->index()->constrained('plans')->restrictOnDelete();
            $table->foreignId('quotation_template_id')->nullable()->constrained('quotation_templates')->nullOnDelete();
            $table->foreignId('payment_term_id')->constrained('payment_terms')->restrictOnDelete();
            $table->string('status', 20)->default('draft')->index();
            $table->boolean('is_paused')->default(false);
            $table->timestamp('paused_at')->nullable();
            $table->date('start_date')->index();
            $table->date('expiry_date')->index();
            $table->date('quotation_valid_until')->nullable();
            $table->date('next_invoice_date')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->timestamp('closed_at')->nullable();
            $table->string('close_reason', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'is_paused', 'next_invoice_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
