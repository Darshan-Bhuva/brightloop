<?php

namespace App\Http\Requests\Report;

class RevenueTrendRequest extends SummaryReportRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'interval' => ['sometimes', 'in:day,week,month'],
        ];
    }
}
