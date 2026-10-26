<?php

test('saving payroll after the session expired redirects to login with 303', function () {
    $response = $this->put('/payroll/2026-10', ['publish' => false], ['X-Inertia' => 'true']);

    $response->assertStatus(303);
    $response->assertRedirect(route('login'));
});

test('guest GET requests still redirect to login with 302', function () {
    $this->get('/payroll')->assertStatus(302)->assertRedirect(route('login'));
});
