-- 008_landlords_optional_contact_and_owner_type.sql
-- Phone/email aren't always available at intake — make them optional.
-- Add "Property Owner" as a valid landlord type.

alter table landlords
  alter column phone drop not null,
  alter column email drop not null;

alter table landlords
  drop constraint landlords_type_check;

alter table landlords
  add constraint landlords_type_check check (type in (
    'Property Management Company',
    'Property Owner',
    'Individual Investor''s LLC',
    'Small Local RE Company',
    'Regional Portfolio Operator',
    'Institutional Landlord',
    'Real Estate Agent',
    'Turnkey Rental Company',
    'Relocation/Corporate Housing Company'
  ));
