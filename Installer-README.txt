maxalbe23 Launcher — instalare și configurare

Installerul instalează launcherul, Launch-Profile.ps1, instrucțiunile și licența BSD-3. Nu include și nu descarcă fișiere GTA VI, builduri de joc, executabile externe sau cache-uri.

Launcherul cere autentificare cu email, parolă și cheia de licență înainte de lansare. Cheia se generează din contul de pe site după configurarea proiectului Supabase. Descărcarea installerului se face dintr-un bucket privat printr-un link temporar, doar pentru conturile autentificate cu licență activă.

Pentru activarea autentificării, site-ul și launcherul au nevoie de URL-ul proiectului și de cheia publică Supabase (publishable key). Cheia secretă/service-role și parola bazei nu trebuie puse în HTML, launcher sau acest pachet.

Fila Setări permite schimbarea folderului jocului, cache-ului și shaderelor, folderelor buildurilor și fișierului TOML NVIDIA. Setările se aplică la următoarea lansare.

La pregătirea shaderelor, scriptul capturează separat stdout și stderr ale executabilului extern, apoi le scrie în log ca text normal. Astfel, mesajele INFO de pe stderr nu mai sunt afișate de PowerShell 5.1 ca NativeCommandError. Codul real de ieșire este verificat; dacă procesul eșuează ori nu confirmă shader-ele, jocul nu pornește.

Instalarea implicită folosește profilul utilizatorului și nu cere drepturi de administrator. Scurtătura de desktop se numește „maxalbe23 Launcher”.

Cerințe locale pentru scriptul de lansare: Windows PowerShell 5.1 și fișierele buildului deja existente pe calculator. Locațiile pot fi schimbate în fila Setări.

Licență: BSD 3-Clause. Vezi LICENSE.txt inclus în instalare și în depozit.