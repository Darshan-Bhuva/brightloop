<?php

namespace App\Enums;

enum DiscountAppliesTo: string
{
    case Products = 'products';
    case Subscription = 'subscription';
}
