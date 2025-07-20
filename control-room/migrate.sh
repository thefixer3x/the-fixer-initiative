#!/usr/bin/env bash
set -e

supabase db pull --project-ref nbmomsntbamfthxfdnme
supabase db pull --project-ref rsabczhfeehazuyajarx
supabase db push --project-ref mxtsdgkwzjzlttpotole

for fn in $(ls supabase/functions); do
  supabase functions deploy "$fn" --project-ref mxtsdgkwzjzlttpotole
done

# Optional storage sync:
# supabase storage list       --project-ref nbmomsntbamfthxfdnme
# supabase storage download   --project-ref nbmomsntbamfthxfdnme --bucket <BUCKET> ./backup/saas/<BUCKET>
# supabase storage upload     --project-ref mxtsdgkwzjzlttpotole --bucket <BUCKET> ./backup/saas/<BUCKET>
# etc.
