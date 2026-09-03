import {
  CARGO_OPTIONS,
  SUPPORTED_CITIES,
  VEHICLE_OPTIONS,
} from "../../utils/routeFormat";
import "./RouteForm.css";

function RouteForm({ values, errors, loading, onChange, onSubmit }) {
  return (
    <section className="route-form" aria-labelledby="route-form-title">
      <div className="route-form__header">
        <h2 id="route-form-title">Plan Your Route</h2>
        <p>Enter journey details to compare safer North-East corridors.</p>
      </div>

      <form className="route-form__body" onSubmit={onSubmit} noValidate>
        <div className="route-form__field">
          <label htmlFor="route-origin">From / Origin</label>
          <select
            id="route-origin"
            name="origin"
            value={values.origin}
            onChange={onChange}
            disabled={loading}
            aria-invalid={Boolean(errors.origin)}
            aria-describedby={errors.origin ? "route-origin-error" : undefined}
          >
            <option value="">Select origin</option>
            {SUPPORTED_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.origin ? (
            <p id="route-origin-error" className="route-form__error">
              {errors.origin}
            </p>
          ) : null}
        </div>

        <div className="route-form__field">
          <label htmlFor="route-destination">To / Destination</label>
          <select
            id="route-destination"
            name="destination"
            value={values.destination}
            onChange={onChange}
            disabled={loading}
            aria-invalid={Boolean(errors.destination)}
            aria-describedby={errors.destination ? "route-destination-error" : undefined}
          >
            <option value="">Select destination</option>
            {SUPPORTED_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.destination ? (
            <p id="route-destination-error" className="route-form__error">
              {errors.destination}
            </p>
          ) : null}
        </div>

        <div className="route-form__field">
          <label htmlFor="route-date">Departure Date</label>
          <input
            id="route-date"
            type="date"
            name="departureDate"
            value={values.departureDate}
            onChange={onChange}
            disabled={loading}
            aria-invalid={Boolean(errors.departureDate)}
            aria-describedby={errors.departureDate ? "route-date-error" : undefined}
          />
          {errors.departureDate ? (
            <p id="route-date-error" className="route-form__error">
              {errors.departureDate}
            </p>
          ) : null}
        </div>

        <div className="route-form__row">
          <div className="route-form__field">
            <label htmlFor="route-cargo">Cargo Type</label>
            <select
              id="route-cargo"
              name="cargoType"
              value={values.cargoType}
              onChange={onChange}
              disabled={loading}
              aria-invalid={Boolean(errors.cargoType)}
            >
              {CARGO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.cargoType ? (
              <p className="route-form__error">{errors.cargoType}</p>
            ) : null}
          </div>

          <div className="route-form__field">
            <label htmlFor="route-vehicle">Vehicle Type</label>
            <select
              id="route-vehicle"
              name="vehicleType"
              value={values.vehicleType}
              onChange={onChange}
              disabled={loading}
              aria-invalid={Boolean(errors.vehicleType)}
            >
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.vehicleType ? (
              <p className="route-form__error">{errors.vehicleType}</p>
            ) : null}
          </div>
        </div>

        <div className="route-form__field">
          <label htmlFor="route-weight">Cargo Weight</label>
          <div className="route-form__weight">
            <input
              id="route-weight"
              type="number"
              name="weight"
              min="0.1"
              step="0.1"
              value={values.weight}
              onChange={onChange}
              disabled={loading}
              aria-invalid={Boolean(errors.weight)}
              aria-describedby={errors.weight ? "route-weight-error" : "route-weight-unit"}
            />
            <span id="route-weight-unit" className="route-form__unit">
              KG
            </span>
          </div>
          {errors.weight ? (
            <p id="route-weight-error" className="route-form__error">
              {errors.weight}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className="route-form__submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Planning Route..." : "Plan Route"}
        </button>
      </form>
    </section>
  );
}

export default RouteForm;
