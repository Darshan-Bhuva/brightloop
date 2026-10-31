<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class CloseSubscriptionRequest extends FormRequest
{
    /**
     * Customer scoping runs before validation so another customer's id is a 404, not a 422.
     */
    public function authorize(): bool
    {
        Gate::authorize('view', $this->route('subscription'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
