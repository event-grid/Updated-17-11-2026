# Backend setup

One Spring Boot modular monolith in one Git repository, with one PostgreSQL database. It serves all three frontends.

**Status (2026-11-11): the backend has been generated** from Spring Initializr with the values below, and the module folders have been added. The steps are kept for reference.

**The `backend` folder is created empty by the folder script.** The script puts nothing inside it. You extract the official Spring Initializr project directly into `<project folder>\backend`. No scratch folder and no file-copy tool are needed.

`<project folder>` means the folder that contains the root `README.md`, wherever you keep it (on the Desktop: `C:\Users\<you>\OneDrive\Desktop\EventGrid\EventGrid`).

## Versions

- Java 25. Check with `java -version`.
- Spring Boot 4.1 requires Java 17 or later, supports up to Java 27, and needs Maven 3.6.3 or later (Spring Boot documentation). Initializr adds the Maven wrapper, so a separate Maven install is optional.
- Use Spring Boot **4.1.2**, the current stable release and the Initializr default (checked 2026-11-11). Do not choose a SNAPSHOT, RC or milestone (4.2.0-RC2 and 4.1.3-SNAPSHOT are also listed).

## Step 1: set the Initializr form

Open https://start.spring.io in your browser and set these fields. **Status: verified on 2026-11-11** against the Initializr metadata (Spring Boot 4.1.2 is the default; Java 27, 25, 21 and 17 are offered). Recheck on screen if this date is old.

| Field | Value |
|---|---|
| Project | Maven |
| Language | Java |
| Spring Boot | 4.1.2 |
| Group | `com.evntgrid` |
| Artifact | `backend` |
| Name | `evntgrid` |
| **Package name** | **`com.evntgrid`** (the default would be `com.evntgrid.backend`, which breaks the module layout) |
| Packaging | Jar |
| Java | 25 (the form defaults to 17; change it) |

Dependencies to add with **ADD DEPENDENCIES**. All ten were found in the Initializr metadata on 2026-11-11. If one is missing on screen, do not substitute another. Write it down and ask:

| Dependency | Reason | Initializr ID |
|---|---|---|
| Spring Web | REST API | `web` |
| Spring Data JPA | Persistence | `data-jpa` |
| PostgreSQL Driver | Database | `postgresql` |
| Flyway Migration | Migrations | `flyway` |
| Spring Security | Authentication and authorization | `security` |
| Validation | Request validation | `validation` |
| Spring Boot Actuator | Health and metrics endpoints | `actuator` |
| Spring Modulith | Module boundaries | `modulith` |
| Testcontainers | Integration tests with real PostgreSQL | `testcontainers` |
| Spring Data Redis (Access+Driver) | Client for the approved Redis | `data-redis` |

**Not added at generation:**

- **OpenTelemetry.** It is part of the approved stack, but its exporters need hosting that is not approved yet (TA-07, TA-08, TA-09). Add it when observability work starts, and verify the starter name then.
- **springdoc-openapi.** In the approved stack, but not offered by Initializr. Add it by hand later, after checking the springdoc documentation for the Spring Boot 4 version.
- **Spring Session Data Redis** (TA-01) and **Spring Cloud AWS** (TA-02). Not approved yet.

## Step 2: download the ZIP

Click **GENERATE**. Your browser downloads `backend.zip`, usually into your Downloads folder.

Shortcut: this link opens the form already filled in with the values above. Check every field before clicking GENERATE:

```text
https://start.spring.io/#!type=maven-project&language=java&platformVersion=4.1.2&packaging=jar&jvmVersion=25&groupId=com.evntgrid&artifactId=backend&name=evntgrid&packageName=com.evntgrid&dependencies=web,data-jpa,postgresql,flyway,security,validation,actuator,modulith,testcontainers,data-redis
```

## Step 3: extract directly into <project folder>\backend

1. Open File Explorer. Check that `<project folder>\backend` exists and is empty.
2. Double-click `backend.zip` to look inside it. **Do not extract yet.**
3. Look at what you see first:
   - **Case A: you see a single folder (probably named `backend`) and nothing else.** Close the ZIP. Right-click `backend.zip`, choose **Extract All...**, and set the destination to `<project folder>`. The files then land in `<project folder>\backend` and there is no extra `backend\backend` folder.
   - **Case B: you see files and folders directly (`pom.xml`, `src`, `mvnw` and so on).** Close the ZIP. Right-click `backend.zip`, choose **Extract All...**, and set the destination to `<project folder>\backend`.
4. If Windows asks about files that already exist, choose **Skip** every time. Never choose Replace.
5. Check the result. `<project folder>\backend\pom.xml` must exist, and `<project folder>\backend\backend` must NOT exist.

If you ended up with `<project folder>\backend\backend`, do not delete anything yourself. Stop and ask for help.

The ZIP contains its own `.gitignore`, `.gitattributes` and `HELP.md`. It must not contain a `.git` folder. Leave these files.

## Step 4: check the generated project

In a terminal opened in the project folder:

```powershell
cd backend
.\mvnw.cmd -v
```

This prints Maven and Java versions. It does not build the project. It may download the Maven wrapper the first time.

## Package layout

The module folders below exist under `src\main\java\com\evntgrid\`, next to the generated application class. They contain only a `.gitkeep`, and no Java classes. Classes are added when business functionality is implemented. Modules with four packages have them created already; reserved and deferred modules have only their root folder.

Each implemented module uses `api`, `application`, `domain` and `infrastructure`:

| Package | Holds |
|---|---|
| `api` | REST controllers per API surface, request and response models, and the module's public contracts and events |
| `application` | Use cases and transaction boundaries |
| `domain` | Entities, value objects, state rules |
| `infrastructure` | Spring Data repositories and external adapters |

Spring Modulith treats sub-packages as private to a module. A type that other modules must call belongs in the module's root package, or in `api` exposed with `@NamedInterface`. Decide this when the first cross-module call is written.

| Module | Status | Notes |
|---|---|---|
| shared | MVP | `kernel`, `error`, `audit`, `idempotency` |
| identity, customer, provider, catalog, discovery, enquiry, quotation, booking, notification | MVP | Four packages each |
| administration | MVP if decision D-18 selects staff-operated provider handling | Pending D-18 |
| complaint | MVP, minimal | Intake of support contacts and incorrect-listing reports only (D-32). All other complaint handling is future (U-24) |
| payment | Not in MVP | Design kept. No business flow until D-24 and U-10 |
| commission, settlement, content | Reserved | No business rules yet (U-22, U-23, U-25) |
| review | **FUTURE / DEFERRED** | Not an MVP module |

Favourites are also **FUTURE / DEFERRED**. They had been planned inside `customer`, and nothing is built for them in the MVP.

Flyway migrations go in `src\main\resources\db\migration\<module>\`, named `V<yyyy>_<mm>_<dd>_<n>__<module>_<description>.sql` so all modules share one ordered history. The `catalog` module has the first two (feature 1).
