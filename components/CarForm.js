"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import { SelectField, TextAreaField, TextField } from "@/components/Form";
import { useAction } from "@/components/Toast";
import { saveCarListing } from "@/lib/cars";
import { FUEL_TYPES, NEIGHBOURHOODS, TRANSMISSIONS } from "@/lib/constants";
import { DEMO_PHOTOS } from "@/lib/photos";

const BLANK = { make: "", model: "", year: new Date().getFullYear() - 2, transmission: "Automatic", fuel: "Petrol", seats: 5, neighbourhood: "Bole", pricePerDay: 3000, latitude: 8.9959, longitude: 38.7852, description: "", photos: [] };

export default function CarForm({ car = null }) {
  const router = useRouter();
  const run = useAction();
  const [form, setForm] = useState(car ? { ...BLANK, ...car } : BLANK);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickHood = (e) => {
    const hood = NEIGHBOURHOODS.find((n) => n.name === e.target.value);
    setForm((f) => ({ ...f, neighbourhood: e.target.value, latitude: hood ? hood.lat : f.latitude, longitude: hood ? hood.lng : f.longitude }));
  };
  const togglePhoto = (src) =>
    setForm((f) => ({ ...f, photos: f.photos.includes(src) ? f.photos.filter((p) => p !== src) : [...f.photos, src] }));

  const submit = (submitForReview) => (e) => {
    e.preventDefault();
    const res = saveCarListing(form, { carId: car?.id || null, submit: submitForReview });
    if (!res.ok) {
      setErrors(res.errors || {});
      setFormError(res.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const msg = car ? "Listing updated." : submitForReview ? "Listing submitted for admin review." : "Draft saved.";
    run(res, msg);
    router.push("/owner/cars");
  };

  return (
    <form className="stack-lg" noValidate onSubmit={submit(true)} aria-label={car ? "Edit listing" : "New listing"}>
      {formError ? <div className="alert alert-error" role="alert"><b>{formError}</b></div> : null}
      {car && car.status === "rejected" ? <div className="alert alert-warning"><b>Rejected by admin</b>{car.rejectionReason} Saving your changes sends the listing for review again.</div> : null}

      <section className="card card-body stack" aria-labelledby="f-details">
        <h2 id="f-details" style={{ fontSize: "1.15rem" }}>Vehicle details</h2>
        <div className="form-grid">
          <TextField label="Make" value={form.make} onChange={set("make")} error={errors.make} placeholder="Toyota" />
          <TextField label="Model" value={form.model} onChange={set("model")} error={errors.model} placeholder="Corolla" />
          <TextField label="Year" type="number" value={form.year} onChange={set("year")} error={errors.year} />
          <TextField label="Seats" type="number" min="2" max="9" value={form.seats} onChange={set("seats")} error={errors.seats} />
          <SelectField label="Transmission" value={form.transmission} onChange={set("transmission")} error={errors.transmission}>
            {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
          </SelectField>
          <SelectField label="Fuel" value={form.fuel} onChange={set("fuel")} error={errors.fuel}>
            {FUEL_TYPES.map((t) => <option key={t}>{t}</option>)}
          </SelectField>
          <TextField label="Price per day (ETB)" type="number" min="500" step="100" value={form.pricePerDay} onChange={set("pricePerDay")} error={errors.pricePerDay} hint="Renters also pay a 10% service fee on top." />
        </div>
        <TextAreaField label="Description" value={form.description} onChange={set("description")} error={errors.description} maxLength={800} hint={`${form.description.length}/800 characters. Describe condition, features and pickup.`} />
      </section>

      <section className="card card-body stack" aria-labelledby="f-loc">
        <h2 id="f-loc" style={{ fontSize: "1.15rem" }}>Pickup area</h2>
        <div className="form-grid">
          <SelectField label="Neighbourhood" value={form.neighbourhood} onChange={pickHood} error={errors.neighbourhood}>
            {NEIGHBOURHOODS.map((n) => <option key={n.name}>{n.name}</option>)}
          </SelectField>
          <div />
          <TextField label="Latitude" type="number" step="0.0001" value={form.latitude} onChange={set("latitude")} error={errors.latitude} />
          <TextField label="Longitude" type="number" step="0.0001" value={form.longitude} onChange={set("longitude")} error={errors.longitude} />
        </div>
        <p className="hint" style={{ margin: 0 }}>Coordinates are filled in from the neighbourhood. Renters see an approximate pickup area, not a live position.</p>
      </section>

      <fieldset className="card card-body stack" aria-describedby="photo-hint">
        <legend style={{ fontSize: "1.15rem", fontWeight: 700 }}>Photos ({form.photos.length} selected)</legend>
        <p id="photo-hint" className="hint" style={{ margin: 0 }}>Choose 1 to 6 photos from the photo library. The first selected photo is the cover.</p>
        {errors.photos ? <span className="error-text" role="alert">{errors.photos}</span> : null}
        <div className="photo-picker">
          {DEMO_PHOTOS.map((p) => (
            <label key={p.src} className="photo-opt">
              <input type="checkbox" checked={form.photos.includes(p.src)} onChange={() => togglePhoto(p.src)} />
              <span className="thumb"><SmartImage src={p.src} alt="" sizes="140px" /></span>
              <span className="cap">{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="btn-row">
        <button type="submit" className="btn btn-primary">{car ? "Save changes" : "Submit for review"}</button>
        {!car ? <button type="button" className="btn btn-secondary" onClick={submit(false)}>Save as draft</button> : null}
        <Link className="btn btn-ghost" href="/owner/cars">Cancel</Link>
      </div>
    </form>
  );
}
