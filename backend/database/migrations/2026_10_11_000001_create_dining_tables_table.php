<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('dining_tables')) {
            Schema::create('dining_tables', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique(); // e.g. T-01, T-02
                $table->string('name')->nullable(); // e.g. Table 01
                $table->integer('capacity')->default(4);
                $table->string('section')->default('Main Dining');
                $table->enum('status', ['available', 'occupied', 'reserved'])->default('available');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dining_tables');
    }
};
