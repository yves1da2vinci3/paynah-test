# Choix d'architecture : une instance PostgreSQL par service

## Décision

Chaque microservice dispose de **sa propre instance PostgreSQL** (conteneur Docker dédié), et non d'une seule instance partagée avec plusieurs bases.

| Service | Conteneur | Port hôte | Base |
|---|---|---|---|
| Comptes | `postgres-comptes` | 5433 | `comptes` |
| Paiements | `postgres-paiements` | 5434 | `paiements` |
| Transactions | `postgres-transactions` | 5435 | `transactions` |

Voir [`docker-compose.yaml`](../docker-compose.yaml).

## Contexte

Le sujet impose **une base PostgreSQL par microservice** et interdit le partage de schéma. Deux mises en œuvre possibles :

1. **Une instance Postgres, trois bases** (`CREATE DATABASE …`)
2. **Trois instances Postgres, une base chacune** (choix retenu)

Les deux respectent l'exigence fonctionnelle. Le second renforce l'isolation opérationnelle.

## Raisons du choix

### 1. Isolation des pannes

Un crash, un OOM ou un redémarrage d'une instance n'affecte que le service concerné. Les deux autres continuent de servir du trafic. Avec une instance unique, une panne Postgres coupe les trois microservices d'un coup.

### 2. Blast radius limité

Une migration ratée, un `VACUUM` agressif ou une saturation de connexions reste confinée à un bounded context. Le ledger (Comptes) ne subit pas un pic de charge du journal (Transactions), et inversement.

### 3. Sécurité et moindre privilège

Chaque service a ses propres credentials (`comptes` / `paiements` / `transactions`). La compromission d'un secret ne donne pas automatiquement accès aux données des autres services. Les volumes Docker sont séparés (`pg_comptes_data`, etc.).

### 4. Indépendance des cycles de vie

Backup, restore, scaling vertical et tuning (`max_connections`, `shared_buffers`) se font **par** service. On peut monter les ressources du ledger sans toucher au journal, ou restaurer Transactions sans écraser Paiements.

### 5. Alignement microservices

Le découpage « un processus applicatif + une base dédiée » reflète la frontière de contexte borné. Aucune tentation de jointure SQL cross-service : les échanges passent par l'API HTTP (ou l'outbox), comme en production.

### 6. Fidélité au brief

Le sujet demande une base par service. Trois instances rendent cette contrainte **visible** dans l'infra (Compose, ports, healthchecks) et facilitent la démonstration lors de la revue.

## Ce que ce choix n'est pas

Ce n'est **pas** une obligation absolue du PDF. Une seule instance Postgres avec trois databases aurait aussi satisfait l'exigence « une base par microservice », avec moins de RAM Docker.

Nous privilégions volontairement l'isolation et la clarté pédagogique / opérationnelle pour un système de paiement, où la séparation des données financières et du journal d'audit a de la valeur.

## Alternative écartée

| Option | Avantage | Pourquoi écartée ici |
|---|---|---|
| 1 Postgres × 3 databases | Plus léger en local | Moins d'isolation panne / sécu / tuning |

Cette alternative reste acceptable pour un environnement contraint ; elle n'a pas été retenue pour ce dépôt.

## Conséquences

- Compose plus verbeux (3 services Postgres + 3 volumes).
- Trois `DATABASE_URL` / blocs `DB_*` distincts dans la config NestJS.
- Healthchecks et ports hôte distincts (5433 / 5434 / 5435) pour éviter les collisions avec un Postgres local éventuel sur 5432.
