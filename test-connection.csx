#!/usr/bin/env dotnet-script
#r "nuget: Npgsql, 8.0.0"

using Npgsql;
using System;

var passwords = new[] { "Quake112", "postgres", "", "admin", "password" };

Console.WriteLine("Testing PostgreSQL connections...\n");

foreach (var pwd in passwords)
{
    var connString = $"Host=localhost;Port=5432;Database=antystics;Username=postgres;Password={pwd}";
    Console.WriteLine($"Trying password: '{pwd}'");
    
    try
    {
        using var conn = new NpgsqlConnection(connString);
        conn.Open();
        Console.WriteLine($"✅ SUCCESS! The password is: '{pwd}'\n");
        Console.WriteLine("Update your user secrets with:");
        Console.WriteLine($"cd backend/Antystics.Api");
        Console.WriteLine($"dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"Host=localhost;Port=5432;Database=antystics;Username=postgres;Password={pwd};Include Error Detail=true\"");
        return;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Failed: {ex.Message}\n");
    }
}

Console.WriteLine("None of the common passwords worked. Please check your PostgreSQL configuration.");

