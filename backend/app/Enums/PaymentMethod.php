<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case BankTransfer = 'bank_transfer';
    case Card = 'card';
    case Upi = 'upi';
    case Cheque = 'cheque';
    case Other = 'other';
}
