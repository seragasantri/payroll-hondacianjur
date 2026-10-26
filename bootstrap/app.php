<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Middleware auth berjalan sebelum HandleInertiaRequests, jadi redirect ke login saat sesi habis
        // tidak diubah Inertia ke 303. Dengan 302, browser mengulang PUT/PATCH/DELETE ke /login (405).
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if ($response->getStatusCode() === 302 && in_array($request->method(), ['PUT', 'PATCH', 'DELETE'])) {
                $response->setStatusCode(303);
            }

            return $response;
        });
    })->create();
