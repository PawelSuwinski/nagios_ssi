# Nagios SSI

Rozszerzenie podstawowej witryny przy użyciu funkcjonalności niestandardowych
nagłówków i stopek CGI.

Więcej:
https://assets.nagios.com/downloads/nagioscore/docs/nagioscore/4/en/cgiincludes.html

Paweł Suwiński, psuw@wp.pl  


## Wymagania

Przeglądarka WWW zgodna z ES6+ i wybranymi funkcjonalnościami ESNext: Chrome,
Firefox, Safari, Edge, Opera.


## Instalacja

Należy umieścić zawartość katalogu [ssi](ssi/) w `nagios/share/ssi/`.


Przykład instalacji umożliwiającej synchronizację z repozytorium przy użyciu git
(`git pull`):

```
$ git clone https://github.com/PawelSuwinski/nagios_ssi
$ echo $PWD/nagios_ssi/ssi /usr/local/nagios/share/ssi none bind 0 0 >> /etc/fstab
$ mount /usr/local/nagios/share/ssi

```

## Funkcjonalności i konfiguracja

### Dodatkowe pola na stronie extinfo


Wyświetlane są następujące dodatkowe pola i elementy:

- niestandardowe zmienne ustawione w konfiguracji usług i hostów
- nazwa komendy `check_command`, jeżeli zalogowany użytkownik należy
  grupy kontaktów (domyślnie _admins_) ustawionej za pomocą atrybutu
	`data-admingroup` w pliku [ssi/ssi/extinfo-footer.ssi](ssi/extinfo-footer.ssi)
- lista grup kontaktów
- lista kontaktów z adresami e-mail oraz numerami telefonów (zmienna `pager`)
  - kontakt na liście jest wyświetlany, jeżeli nie jest oznaczony jako ukryty
    przez ustawienie zmiennej niestandardowej `contact_hide` na wartość różną
    od 0 w definicji kontaktu
  - numer telefonu dla kontaktu jest wyświetlany, jeżeli nie jest oznaczony
    jako ukryty poprzez ustawienie zmiennej `pager_hide` na wartość różną
    od 0 w definicji kontaktu
- link _Mail to all_ jeżeli na liście kontaktów znajdują się adresy e-mail

Wygląd oraz kolejność wyświetlanych elementów można dostosować za pomocą stylów
oraz atrybutu `data-topvar` w pliku [ssi/ssi/extinfo-footer.ssi](ssi/extinfo-footer.ssi).

Więcej:
[How Macros Work](https://assets.nagios.com/downloads/nagioscore/docs/nagioscore/4/en/macros.html), 
[Object Definitions](https://assets.nagios.com/downloads/nagioscore/docs/nagioscore/4/en/objectdefinitions.html).

### Wykonanie komendy na więcej niż jednej usłudze lub hoście


Strona statusu umożliwia zaznaczenie usług lub hostów, które po kliknięciu
komendy z listy zostają przesłane dalej do etapu konfiguracji komendy.
Zaznaczenie elementu blokuje automatyczne odświeżanie strony statusu.

Lista komend jest pobierana z wiersza zaznaczonego w pierwszej kolejności lub
pierwszego z listy, jeżeli zaznaczono wszystkie na raz, oraz jest usuwana,
jeżeli nie pozostanie już więcej żadnych zaznaczonych elementów.

Strona konfiguracji komendy umożliwia podawanie w polu _Host_ dla komend
dotyczących hostów oraz w polu _Service_ dla komend dotyczących usług więcej
niż jednego obiektu wg. określonego formatu (zobacz [cmd-footer.js](ssi/js/cmd-footer.js)).

Jeżeli format się zgadza to formularz jest wysyłany asynchronicznie dla każdego
hosta lub usługi oddzielnie. W innym przypadku działa domyślnie.  W przypadku
niepowodzenia przetwarzania komendy na liście błędów znajdzie się odnośnik
umożliwiający ponowne otwarcie strony konfiguracji komendy dla tego przypadku
i ewentualne ręczne ponowienie przetwarzania.

### Wykonanie komendy na więcej niż jednym komentarzu i przestoju


Strona komentarzy (`extinfo.cgi?type=3`) oraz przestojów (`extinfo.cgi?type=6`)
umożliwia zaznaczenie wielu elementów, które po kliknięciu akcji z menu
znajdującego się nad tabelą z listą zostają przesłane dalej do etapu
konfiguracji. Zaznaczenie elementu blokuje automatyczne odświeżanie strony.

Po załadowaniu strony menu akcji każdej z list jest uzupełnianie o dodatkowe
pozycje na podstawie pola _Actions_ pierwszego elementu. W obecnej wersji
Nagios Core w tym miejscu znajduje się tylko jedna akcja usuwania elementu, a
początkowe menu dla listy zawiera akcję dodania nowego elementu.

Strona konfiguracji komendy umożliwia podawanie w polu ID  listy w postaci
liczb rozdzielonych przecinkiem (zobacz [cmd-footer.js](ssi/js/cmd-footer.js)).

Działanie formularza opisano w poprzedniej sekcji.

### Eksport tabeli statusów do pliku CSV


Strona statusu umożliwia export zaznaczonych wierszy tabeli do pliku CSV wraz z
dodatkowymi polami dla danego hosta lub usługi:

- lista kontaktów
- lista grup kontaktów
- niestandardowe zmienne


## Testy automatyczne

```
$ npm test
> selenium-side-runner tests/*.side
info:    Running tests/tests.side
 PASS  ./csvExport.test.js (15.602s)
 PASS  commandPanel/statusCommandsOnHostsAndServices.test.js (18.868s)
 PASS  commandPanel/statusCommandsAbsent.test.js (5.595s)
 PASS  commandPanel/statusHostsCommandExec.test.js (8.862s)
 PASS  commandPanel/statusCommandsReload.test.js (5.344s)
 PASS  commandPanel/statusServicesCommandExec.test.js (5.809s)
 PASS  customVars/customVarsOnHostState.test.js
 PASS  customVars/customVarsOnServiceState.test.js
 PASS  customVars/customVarsCheckCommandNoAdmin.test.js
 PASS  ./bulkRemove.test.js (127.819s)

Test Suites: 10 passed, 10 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        128.77s, estimated 139s
Ran all test suites.
```
