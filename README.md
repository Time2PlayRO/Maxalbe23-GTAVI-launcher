# maxalbe23 Launcher

Launcher pentru builduri și profiluri de performanță, cu interfață futuristă, fila Setări și autentificare prin Supabase.

## Site și descărcare protejată

Site-ul folosește Supabase Auth. Descărcarea nu mai are URL public: `create-download` verifică sesiunea și licența, apoi returnează un URL de 120 de secunde pentru fișierul din bucketul privat `launcher-downloads`.

`auth.js` și launcherul conțin doar cheia publică publishable, după ce este configurată. Nu introduce parola bazei sau cheia secretă/service-role în client.

## Configurare Supabase

1. Creează proiectul și păstrează activate Data API și activarea automată RLS; acordă acces API doar explicit când este necesar.
2. Aplică migrarea din `supabase/migrations`.
3. Publică funcțiile `launcher-account`, `verify-launcher` și `create-download`. Gateway JWT este oprit pentru aceste funcții, dar fiecare handler autentifică tokenul de utilizator prin `@supabase/server` (`auth: "user"`).
4. Încarcă installerul în bucketul privat `launcher-downloads` sub numele `maxalbe23-launcher-setup.exe`.
5. Configurația acestui proiect include cheia publică publishable în `auth.js` și launcher. Cheile publice pot fi incluse în client; cheia secretă/service-role și parola bazei nu trebuie puse în HTML, launcher sau acest pachet.

Proiectul folosește ref-ul `bkvsimqhmalrkudxnxbz`. Edge Functions citesc cheia secretă din variabilele Supabase de pe server; aceasta nu se publică.

## Launcher

Fila Setări controlează căile locale. Înainte de pornire, launcherul autentifică utilizatorul și verifică cheia de licență la funcția `verify-launcher`. ID-ul asociat este aleator per instalare și nu colectează componente hardware.

Scriptul de shader capturează separat ieșirile native pentru a evita eroarea falsă `NativeCommandError` în PowerShell 5.1. Un cod de ieșire real diferit de zero oprește fluxul înainte ca jocul să fie pornit.

Installerul distribuie doar launcherul, scriptul și documentația; nu conține jocul, buildurile externe sau cache-uri.

## Licență

BSD 3-Clause License. Vezi `LICENSE`.
