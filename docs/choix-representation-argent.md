# Choix d'architecture : représentation de l'argent (`amountMinor`)

## Décision

Tout montant monétaire du système est un **entier positif en unités mineures** (`amountMinor`), associé à une devise ISO 4217 (`currency`), jamais un `float` ni une décimale en base.

Type partagé : [`libs/shared-kernel/src/money.ts`](../libs/shared-kernel/src/money.ts).

```typescript
export type Money = {
  amountMinor: number; // entier > 0
  currency: string;    // ex. "XOF", "EUR"
};
```

En base : colonnes `BIGINT` du type `amount_minor` / `balance_minor` (voir LLD Comptes / Paiements / Transactions).

## Contexte

Un paiement manipule des soldes, débits, crédits et journaux. Trois représentations courantes :

1. **Float** (`10.5`) — imprécis en binaire
2. **Décimal / string** (`"10.50"`) — correct mais plus lourd et ambigu (locale, séparateurs)
3. **Entier en unités mineures** (`1050` centimes pour `10,50 EUR`) — **choix retenu**

## Qu'est-ce qu'une unité mineure ?

C'est la plus petite subdivision usuelle de la devise :

| Devise | Exemple humain | `amountMinor` | Unité |
|---|---|---|---|
| EUR | 10,50 € | `1050` | centime |
| USD | 1,00 $ | `100` | cent |
| XOF | 500 F | `500` | franc (pas de centimes) |

La conversion affichage ↔ stockage dépend de l'échelle ISO de la devise (souvent 2 décimales ; 0 pour le XOF).

## Raisons du choix

### 1. Pas d'erreurs d'arrondi float

`0.1 + 0.2 !== 0.3` en IEEE-754. Sur un ledger, ça produit des soldes incohérents, des écarts de réconciliation et des bugs intermittents. Un entier évite complètement ce piège.

### 2. Comparaisons et arithmétique exactes

Débit conditionnel du type « solde ≥ montant » reste exact :

```sql
UPDATE wallets
SET balance_minor = balance_minor - $amount
WHERE id = $id AND balance_minor >= $amount
RETURNING balance_minor;
```

Pas de seuil flou, pas d'epsilon.

### 3. Contrat unique cross-services

Comptes, Paiements et Transactions parlent le même langage (`Money` / `amount_minor`). Les événements (`payment.succeeded`, etc.) transportent `amount_minor` + `currency` sans ambiguïté d'échelle.

### 4. Alignement sécurité / brief

Le baseline HLD impose `amount_minor: integer` et le rejet des float / strings non entières. `assertMoney` refuse tout montant non entier ou ≤ 0.

### 5. Stockage Postgres simple

`BIGINT` + `CHECK (amount_minor > 0)` : indexable, comparable, sans dépendance à un type décimal applicatif.

## Ce que ce choix n'est pas

Ce n'est **pas** « on ignore les décimales ». Les décimales existent à l'affichage UI ; le système les convertit **une fois** à la bordure (API / client) vers/depuis `amountMinor`.

Ce n'est **pas** non plus une lib monétaire complète (pas de conversion FX, pas de rounding rules multi-devises). Pour ce test : une devise par opération, montant entier strict.

## Alternative écartée

| Option | Avantage | Pourquoi écartée ici |
|---|---|---|
| `number` float | Simple à écrire | Imprécis, dangereux pour un ledger |
| `decimal` / string `"10.50"` | Lisible | Parsing locale, risque double représentation, comparaisons plus fragiles |
| Montant + `scale` explicite partout | Très précis multi-devises | Surdimensionné pour le scope ; l'échelle se déduit de `currency` |

## Conséquences

- APIs et events : toujours `amountMinor` / `amount_minor` (entier), jamais `amount: 10.5`.
- Validation : `Number.isInteger(amountMinor) && amountMinor > 0` + `currency` sur 3 lettres majuscules.
- UI / docs démo : convertir explicitement (ex. XOF : facteur 1 ; EUR : facteur 100).
- Soldes wallets et lignes ledger en `balance_minor` / `amount_minor` uniquement.
