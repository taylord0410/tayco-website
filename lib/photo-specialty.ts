import type { MarketSpecialtyId } from "@/lib/property-catalog";

/**
 * Explicit photo-by-photo specialty mapping (Rule 9 / HUB & ARTEMIS audit 2026-11-08).
 * Every service trade photo is assigned to the specialty of the trade actually shown in the photo,
 * rather than derived from the service card title.
 */
export const PHOTO_SPECIALTY: Record<string, MarketSpecialtyId> = {
  // Commercial — Roofing
  "/curated/commercial/com_04_2.jpg": "roofing",
  "/curated/commercial/cx_r1.jpg": "roofing",
  "/curated/commercial/com_04_1.jpg": "roofing",
  // Commercial — Exterior / Siding / Masonry
  "/curated/commercial/com_02_2.jpg": "siding",
  "/curated/commercial/cx_o3.jpg": "siding",
  "/curated/hero/com-plaza-stone.jpg": "stone",
  // Commercial — Framing
  "/curated/commercial/com-cfs-stud-framing-3story.jpg": "framing",
  "/curated/magazine/revista_fr_metal_04.jpg": "framing",
  "/curated/hero/com-dusk-steel.jpg": "framing",
  // Commercial — Flooring
  "/curated/commercial/com-lobby-porcelain-tile.jpg": "flooring",
  "/work/flooring_commercial.jpg": "flooring",
  "/curated/commercial/com_03_2.jpg": "flooring",
  // Commercial — Interiors / Drywall
  "/work/drywall_commercial.jpg": "drywall",
  "/curated/commercial/com_03_1.jpg": "drywall",
  "/curated/commercial/cx_i1.jpg": "carpentry",
  // Commercial — Tenant Improvements / Carpentry
  "/curated/commercial/com_01_1.jpg": "carpentry",
  "/curated/commercial/com-retail-fitout-shelving.jpg": "carpentry",
  "/curated/commercial/cx_y3.jpg": "carpentry",
  // Commercial — Site Preparation -> Concrete
  "/curated/magazine/revista_ex_sp_demo.jpg": "concrete",
  "/curated/magazine/revista_ex_ex_mass.jpg": "concrete",
  "/curated/magazine/revista_ex_ex_found.jpg": "concrete",
  // Commercial — Foundations & Concrete
  "/curated/commercial/com-slab-stem-walls.jpg": "concrete",
  "/curated/commercial/com-foundation-pad-rebar.jpg": "concrete",
  "/curated/commercial/com-warehouse-industrial-floor.jpg": "concrete",
  // Commercial — Property Programs
  "/curated/commercial/com-office-park-exterior-program.jpg": "siding",
  "/curated/commercial/com-retail-strip-envelope-rehab.jpg": "siding",
  "/curated/commercial/com-office-corridor-turnover.jpg": "drywall",
  // Commercial — Restoration
  "/curated/capabilities/fire-steel-ibeam.jpg": "framing",
  "/curated/pairs/div04_03_antes.jpg": "roofing",
  "/curated/commercial/com-water-mitigation-office.jpg": "drywall",

  // Residential (Single-Family, Multifamily, Townhomes) — Roofing
  "/curated/pairs/div02_02_despues.jpg": "roofing",
  "/curated/residential/div04_06_despues.jpg": "roofing",
  "/curated/properties/mkt-mf-roofing.jpg": "roofing",
  "/curated/capabilities/mf-tpo-capex.jpg": "roofing",
  "/work/roofing_multifamily.jpg": "roofing",
  "/curated/properties/mkt-twn-roofing-siding.jpg": "roofing",
  "/curated/properties/townhouse-03-brownstone-mansard-row.jpg": "roofing",
  "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg": "roofing",

  // Residential — Siding / Windows & Doors / Masonry
  "/curated/residential/s1.jpg": "siding",
  "/curated/residential/div01_04_despues.jpg": "siding",
  "/curated/residential/div02_06_despues.jpg": "siding",
  "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg": "siding",
  "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg": "siding",
  "/work/siding_multifamily.jpg": "siding",
  "/curated/properties/townhouse-01-brick-limestone-row.jpg": "stone",
  "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg": "siding",
  "/work/siding_townhomes.jpg": "siding",

  // Residential — Framing
  "/curated/pairs/div01_01_despues.jpg": "framing",
  "/curated/residential/div01_06_despues.jpg": "framing",
  "/curated/magazine/revista_fr_wood_05.jpg": "framing",
  "/curated/properties/mkt-mf-framing.jpg": "framing",
  "/curated/properties/mkt-mf-framing-trusses.jpg": "framing",
  "/curated/properties/mkt-twn-framing-row.jpg": "framing",
  "/curated/properties/mkt-twn-framing-partywall.jpg": "framing",
  "/curated/properties/mkt-twn-framing-rooftop.jpg": "framing",

  // Residential — Drywall & Painting
  "/curated/residential/sf-drywall-level5-living.jpg": "drywall",
  "/curated/magazine/revista_in_05_a.jpg": "drywall",
  "/curated/residential/sf-interior-painting-bedroom.jpg": "drywall",
  "/curated/properties/mkt-mf-drywall.jpg": "drywall",
  "/curated/properties/interior-duplex-brick-living.jpg": "drywall",
  "/work/drywall_multifamily.jpg": "drywall",
  "/curated/properties/mkt-twn-drywall-gallery.jpg": "drywall",
  "/curated/properties/mkt-twn-framing-drywall.jpg": "drywall",
  "/work/painting_townhomes.jpg": "drywall",

  // Residential — Carpentry
  "/curated/pairs/div03_02_despues.jpg": "carpentry",
  "/curated/pairs/div01_03_despues.jpg": "carpentry",
  "/curated/residential/div01_05_despues.jpg": "carpentry",
  "/curated/properties/mkt-mf-carpentry-lounge.jpg": "carpentry",
  "/curated/properties/interior-duplex-brick-kitchen.jpg": "carpentry",
  "/curated/properties/interior-limestone-modern-kitchen.jpg": "carpentry",
  "/curated/properties/mkt-twn-carpentry-library.jpg": "carpentry",
  "/curated/properties/interior-townhouse-parlor-kitchen.jpg": "carpentry",
  "/curated/properties/mkt-twn-flooring-stairtreads.jpg": "flooring",

  // Residential — Foundations, Concrete & Stone
  "/curated/residential/div01_07_despues.jpg": "concrete",
  "/curated/pairs/div02_03_despues.jpg": "stone",
  "/curated/residential/sf-concrete-driveway-front-walk.jpg": "concrete",
  "/curated/properties/mkt-mf-concrete-podium.jpg": "concrete",
  "/curated/properties/mkt-mf-stone-courtyard.jpg": "stone",
  "/curated/properties/mkt-mf-flooring-concrete.jpg": "concrete",
  "/curated/properties/mkt-twn-concrete-stone.jpg": "concrete",
  "/curated/properties/mkt-twn-concrete-drive.jpg": "concrete",
  "/curated/properties/mkt-twn-stone-gardenwall.jpg": "stone",

  // Residential — Restoration (assigned by visible trade)
  "/curated/capabilities/fire-wood-framing.jpg": "framing",
  "/curated/residential/sf-drywall-water-repair-bedroom.jpg": "drywall",
  "/curated/capabilities/mit-taped-drywall.jpg": "drywall",
  "/curated/pairs/div03_04_antes.jpg": "drywall",
  "/curated/residential/sf-drywall-flood-basement.jpg": "drywall",
  "/curated/residential/sf-finished-basement-office.jpg": "flooring",

  // Residential — Renovation / Remodeling (assigned by visible trade)
  "/curated/residential/sf-finished-basement-lounge.jpg": "flooring",
  "/curated/residential/div03_03_despues.jpg": "flooring",
  "/curated/residential/div01_08_despues.jpg": "carpentry",
  "/curated/properties/duplex-04-evanston-corner-twoflat.jpg": "siding",
  "/curated/properties/interior-limestone-modern-living.jpg": "flooring",
  "/curated/properties/interior-duplex-rear-patio-courtyard.jpg": "concrete",
  "/curated/properties/townhouse-04-chicago-endunit-brick.jpg": "stone",
  "/curated/properties/interior-townhouse-living-bay.jpg": "flooring",
  "/curated/properties/interior-townhouse-rooftop-terrace.jpg": "carpentry",

  // Work-in-progress field photos — Single-Family
  "/curated/obra/single-family/sf-roofing-tearoff.jpg": "roofing",
  "/curated/obra/single-family/carpentry-1.jpg": "carpentry",
  "/curated/obra/single-family/concrete-1.jpg": "concrete",
  "/curated/obra/single-family/flooring-1.jpg": "flooring",
  "/curated/obra/single-family/stone-1.jpg": "stone",
  "/curated/obra/single-family/stone-2.jpg": "stone",

  // Work-in-progress field photos — Multifamily
  "/curated/obra/multifamily/mf-roofing-tpo.jpg": "roofing",
  "/curated/obra/multifamily/roofing-1.jpg": "roofing",
  "/curated/obra/multifamily/siding-1.jpg": "siding",
  "/curated/obra/multifamily/siding-2.jpg": "siding",
  "/curated/obra/multifamily/carpentry-1.jpg": "carpentry",
  "/curated/obra/multifamily/carpentry-2.jpg": "carpentry",
  "/curated/obra/multifamily/concrete-1.jpg": "concrete",
  "/curated/obra/multifamily/concrete-2.jpg": "concrete",
  "/curated/obra/multifamily/flooring-1.jpg": "flooring",
  "/curated/obra/multifamily/flooring-2.jpg": "flooring",
  "/curated/obra/multifamily/stone-1.jpg": "stone",
  "/curated/obra/multifamily/stone-2.jpg": "stone",

  // Work-in-progress field photos — Townhomes
  "/curated/obra/townhomes/tw-roofing-standing-seam.jpg": "roofing",
  "/curated/obra/townhomes/roofing-1.jpg": "roofing",
  "/curated/obra/townhomes/siding-1.jpg": "siding",
  "/curated/obra/townhomes/siding-2.jpg": "siding",
  "/curated/obra/townhomes/drywall-1.jpg": "drywall",
  "/curated/obra/townhomes/carpentry-1.jpg": "carpentry",
  "/curated/obra/townhomes/carpentry-2.jpg": "carpentry",
  "/curated/obra/townhomes/concrete-1.jpg": "concrete",
  "/curated/obra/townhomes/concrete-2.jpg": "concrete",
  "/curated/obra/townhomes/flooring-1.jpg": "flooring",
  "/curated/obra/townhomes/flooring-2.jpg": "flooring",
  "/curated/obra/townhomes/stone-1.jpg": "stone",
  "/curated/obra/townhomes/stone-2.jpg": "stone",

  // Work-in-progress field photos — Commercial
  "/curated/obra/commercial/com-roofing-teardown.jpg": "roofing",
  "/curated/obra/commercial/roofing-1.jpg": "roofing",
  "/curated/obra/commercial/stone-1.jpg": "stone",
  "/curated/obra/commercial/stone-2.jpg": "stone",
  "/curated/obra/commercial/flooring-1.jpg": "flooring",
  "/curated/obra/commercial/flooring-2.jpg": "flooring",
  "/curated/obra/commercial/carpentry-1.jpg": "carpentry",
  "/curated/obra/commercial/carpentry-2.jpg": "carpentry",
};
