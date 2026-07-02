# AI.VOTE - Vercel One-Click Deploy Script
# This script guides you to deploy your site to Vercel.

Set-Location $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   AI.VOTE - Vercel Deployment Tool" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Checking Vercel CLI status..." -ForegroundColor Yellow
Write-Host "This will launch Vercel's interactive setup." -ForegroundColor Gray
Write-Host "Instructions: If prompted, log in (recommended to choose 'Continue with GitHub'), then accept the defaults by pressing Enter." -ForegroundColor Gray
Write-Host ""

# Run Vercel deployment
# --yes flags bypasses the initial questions using sensible defaults
npx -y vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Success! Your site is deployed to Vercel!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Vercel deployment completed or requires manual setup." -ForegroundColor Yellow
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
