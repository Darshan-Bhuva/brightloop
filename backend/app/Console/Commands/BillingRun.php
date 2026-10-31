<?php

namespace App\Console\Commands;

use App\Services\BillingService;
use Illuminate\Console\Command;

class BillingRun extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'billing:run {--date= : As of date in YYYY-MM-DD format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run billing engine to generate invoices for due subscriptions';

    /**
     * Execute the console command.
     */
    public function handle(BillingService $billingService): int
    {
        $date = $this->option('date') ?: now()->toDateString();

        $this->info("Running billing engine as of {$date}...");

        $result = $billingService->runBilling($date);

        $this->table(
            ['Metric', 'Value'],
            [
                ['As of date', $result['as_of_date']],
                ['Processed subscriptions', $result['processed']],
                ['Invoices created', $result['invoices_created']],
                ['Periods skipped', $result['skipped']],
                ['Failed subscriptions', $result['failed']],
                ['Auto-closed subscriptions', $result['auto_closed']],
            ]
        );

        if (! empty($result['failures'])) {
            $this->error('Failures occurred during billing run:');
            foreach ($result['failures'] as $failure) {
                $this->line("- Sub #{$failure['number']} (ID: {$failure['subscription_id']}): {$failure['message']}");
            }

            return self::FAILURE;
        }

        $this->info('Billing run completed successfully.');

        return self::SUCCESS;
    }
}
