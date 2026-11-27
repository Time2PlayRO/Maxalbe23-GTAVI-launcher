# Installer distribution

The public GitHub `downloads` folder is intentionally kept free of the installer binary. The website requests a short-lived URL from the authenticated `create-download` Supabase Edge Function, which serves the installer from the private `launcher-downloads` Storage bucket.

Do not add the installer here: a public file URL would bypass the account and license check.
