<?php

namespace App\Enums;

enum TaxType: string
{
    case Percentage = 'percentage';
    case Fixed = 'fixed';
}
