alter table public.users add column if not exists base_currency text not null default 'INR';
alter table public.transactions add column if not exists currency text not null default 'INR';
alter table public.budgets add column if not exists currency text not null default 'INR';
alter table public.goals add column if not exists currency text not null default 'INR';
alter table public.forecasts add column if not exists currency text not null default 'INR';
alter table public.assets add column if not exists currency text not null default 'INR';
alter table public.liabilities add column if not exists currency text not null default 'INR';
alter table public.credit_profiles add column if not exists currency text not null default 'INR';

alter table public.users drop constraint if exists users_base_currency_check;
alter table public.users add constraint users_base_currency_check check (base_currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));

alter table public.transactions drop constraint if exists transactions_currency_check;
alter table public.transactions add constraint transactions_currency_check check (currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));

alter table public.budgets drop constraint if exists budgets_currency_check;
alter table public.budgets add constraint budgets_currency_check check (currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));

alter table public.goals drop constraint if exists goals_currency_check;
alter table public.goals add constraint goals_currency_check check (currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));

alter table public.forecasts drop constraint if exists forecasts_currency_check;
alter table public.forecasts add constraint forecasts_currency_check check (currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));

alter table public.assets drop constraint if exists assets_currency_check;
alter table public.assets add constraint assets_currency_check check (currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));

alter table public.liabilities drop constraint if exists liabilities_currency_check;
alter table public.liabilities add constraint liabilities_currency_check check (currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));

alter table public.credit_profiles drop constraint if exists credit_profiles_currency_check;
alter table public.credit_profiles add constraint credit_profiles_currency_check check (currency in ('INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY'));