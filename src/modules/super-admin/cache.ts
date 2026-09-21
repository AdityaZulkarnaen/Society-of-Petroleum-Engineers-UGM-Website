/** Tag for data that is the same for every super admin, so it may live
    between requests: the division overview. Mutations that change member or
    proker counts revalidate it. */
export const DIVISIONS_TAG = "divisions-overview";
