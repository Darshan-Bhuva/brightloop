<?php

namespace App\Enums;

/**
 * Derived from a discount's flags and dates; never stored.
 */
enum DiscountState: string
{
    case Active = 'active';
    case Scheduled = 'scheduled';
    case Expired = 'expired';
    case Exhausted = 'exhausted';
    case Inactive = 'inactive';
}
