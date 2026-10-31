<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for M8 performance optimizations.
     */
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('closed_at');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index('created_at');
            $table->index(['status', 'invoice_date']);
            $table->index(['status', 'due_date', 'amount_due']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['payment_date', 'amount']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['payment_date', 'amount']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_created_at_index');
            $table->dropIndex(['status', 'invoice_date']);
            $table->dropIndex(['status', 'due_date', 'amount_due']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('subscriptions_created_at_index');
            $table->dropIndex('subscriptions_closed_at_index');
        });
    }
};
