
-- ==========================================
-- MONTHLY MUTT COUNTER
-- FINAL DATABASE SCHEMA
-- Timezone: Asia/Dhaka
-- ==========================================

-- 1. Monthly counter table

CREATE TABLE IF NOT EXISTS public.monthly_counts (
    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    month_start DATE NOT NULL,

    total BIGINT NOT NULL DEFAULT 0
        CHECK (total >= 0),

    PRIMARY KEY (user_id, month_start),

    CHECK (
        EXTRACT(DAY FROM month_start) = 1
    )
);

-- 2. Enable Row Level Security

ALTER TABLE public.monthly_counts
ENABLE ROW LEVEL SECURITY;

-- 3. Users can only read their own records

DROP POLICY IF EXISTS "Users read their own counts"
ON public.monthly_counts;

CREATE POLICY "Users read their own counts"
ON public.monthly_counts
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- No direct editing, resetting, or deleting

REVOKE ALL ON public.monthly_counts
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.monthly_counts
TO authenticated;

-- 4. Get current calendar month

CREATE OR REPLACE FUNCTION public.get_current_month()
RETURNS DATE
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT date_trunc(
        'month',
        now() AT TIME ZONE 'Asia/Dhaka'
    )::date;
$$;

REVOKE ALL ON FUNCTION public.get_current_month()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_month()
TO authenticated;

-- 5. Increment current month's counter by one

CREATE OR REPLACE FUNCTION public.increment_monthly_count()
RETURNS TABLE (
    month_start DATE,
    total BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_month DATE;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Login required';
    END IF;

    v_month :=
        date_trunc(
            'month',
            now() AT TIME ZONE 'Asia/Dhaka'
        )::date;

    RETURN QUERY
    INSERT INTO public.monthly_counts AS mc (
        user_id,
        month_start,
        total
    )
    VALUES (
        v_user_id,
        v_month,
        1
    )
    ON CONFLICT ON CONSTRAINT monthly_counts_pkey
    DO UPDATE
        SET total = mc.total + 1
    RETURNING
        mc.month_start,
        mc.total;
END;
$$;

-- 6. Allow authenticated users to increment

REVOKE ALL ON FUNCTION
public.increment_monthly_count()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.increment_monthly_count()
TO authenticated;

-- ==========================================
-- END OF SCHEMA
-- ==========================================
