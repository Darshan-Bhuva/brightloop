<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Draft = 'draft';
    case Quotation = 'quotation';
    case Confirmed = 'confirmed';
    case Active = 'active';
    case Closed = 'closed';
}
