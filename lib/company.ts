/** Public company details verified against taycoturnkey.com on 2026-10-23.
 * Keep marketing contact details separate from illustrative ERP records.
 */
export const COMPANY = {
  name: "TAYCO LLC",
  tagline: "Full-Service Construction Company",
  phoneDisplay: "857-230-1452",
  phoneHref: "tel:+18572301452",
  email: "general@taycoturnkey.com",
  emailHref: "mailto:general@taycoturnkey.com",
  hours: "Mon–Fri 7am–6pm",
  saturday: "Saturday by appointment",
  states: ["WI", "IL", "IA", "IN", "MN", "MI", "MO", "TX"],
  coverage: "WI · IL · IA · IN · MN · MI · MO · TX",
  sourceUrl: "https://www.taycoturnkey.com/",
} as const;

export const COMPANY_SERVICES = [
  { label: "Commercial construction", href: "/commercial", detail: "Ground-up construction, design-build, tenant improvements and construction management." },
  { label: "Residential renovation", href: "/residential", detail: "Home renovations, kitchens, bathrooms, additions and basement finishing." },
  { label: "Fire & water restoration", href: "/residential#restoration", detail: "Damage assessment, restoration planning and reconstruction." },
  { label: "Roofing & exterior", href: "/commercial#services", detail: "Roofing, siding, windows, doors and exterior improvements." },
  { label: "Flooring & interiors", href: "/residential#services", detail: "Flooring, drywall, painting, cabinetry and finish carpentry." },
  { label: "Electrical & plumbing", href: "/commercial#services", detail: "Coordinated building services as part of your project scope." },
] as const;

/** Coverage and representative cities from the client's existing public website. */
export const COMPANY_SERVICE_AREAS = [
  { state: "Wisconsin", code: "WI", cities: "Milwaukee, Madison, Kenosha, Racine, Green Bay and surrounding areas" },
  { state: "Illinois", code: "IL", cities: "Chicago, Rockford, Aurora, Naperville, Joliet and surrounding areas" },
  { state: "Iowa", code: "IA", cities: "Des Moines, Cedar Rapids, Davenport, Iowa City and surrounding areas" },
  { state: "Indiana", code: "IN", cities: "Indianapolis, Fort Wayne, South Bend, Evansville and surrounding areas" },
  { state: "Minnesota", code: "MN", cities: "Minneapolis, St. Paul, Bloomington, Rochester and surrounding areas" },
  { state: "Michigan", code: "MI", cities: "Detroit, Grand Rapids, Lansing, Ann Arbor and surrounding areas" },
  { state: "Missouri", code: "MO", cities: "St. Louis, Kansas City, Springfield, Columbia and surrounding areas" },
  { state: "Texas", code: "TX", cities: "Dallas, Houston, San Antonio, Austin, Fort Worth and surrounding areas" },
] as const;
