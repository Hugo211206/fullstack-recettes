import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../utils/recipe';

function validate(values) {
  const errors = {};
  const title = values.title.trim();

  if (title.length < 1 || title.length > 120) {
    errors.title = 'Le titre doit contenir entre 1 et 120 caractères.';
  }

  if (!CATEGORIES.some((item) => item.value === values.category)) {
    errors.category = 'Choisissez une catégorie.';
  }

  const hours = Number(values.hours);
  const minutes = Number(values.minutes);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    errors.prepTime = 'Saisissez des heures entre 0 et 24 et des minutes entre 0 et 59 (nombres entiers).';
  } else {
    const total = hours * 60 + minutes;
    if (total < 1 || total > 1440) {
      errors.prepTime = 'Le temps de préparation doit être compris entre 1 minute et 24 heures.';
    }
  }

  if (values.ingredients.length > 2000) {
    errors.ingredients = 'Les ingrédients ne doivent pas dépasser 2000 caractères.';
  }

  if (values.instructions.length > 5000) {
    errors.instructions = 'La préparation ne doit pas dépasser 5000 caractères.';
  }

  return errors;
}

function RecipeForm({ initialValues, submitLabel, cancelTo, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setServerError('');
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        category: values.category,
        prepTime: Number(values.hours) * 60 + Number(values.minutes),
        ingredients: values.ingredients,
        instructions: values.instructions,
      });
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {serverError && <p className="alert alert-error" role="alert">{serverError}</p>}

      <div className="field">
        <label htmlFor="title">Titre</label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={120}
          value={values.title}
          onChange={handleChange}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && <p id="title-error" className="field-error">{errors.title}</p>}
      </div>

      <div className="field">
        <label htmlFor="category">Catégorie</label>
        <select
          id="category"
          name="category"
          value={values.category}
          onChange={handleChange}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? 'category-error' : undefined}
        >
          <option value="">Choisir…</option>
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        {errors.category && <p id="category-error" className="field-error">{errors.category}</p>}
      </div>

      <fieldset className="fieldset field" aria-describedby={errors.prepTime ? 'prep-time-error' : undefined}>
        <legend>Temps de préparation</legend>
        <div className="field-row-compact">
          <div className="field-inline">
            <input
              id="hours"
              name="hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              value={values.hours}
              onChange={handleChange}
              aria-invalid={Boolean(errors.prepTime)}
            />
            <label htmlFor="hours">heures</label>
          </div>
          <div className="field-inline">
            <input
              id="minutes"
              name="minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={values.minutes}
              onChange={handleChange}
              aria-invalid={Boolean(errors.prepTime)}
            />
            <label htmlFor="minutes">minutes</label>
          </div>
        </div>
        {errors.prepTime && <p id="prep-time-error" className="field-error">{errors.prepTime}</p>}
      </fieldset>

      <div className="field">
        <label htmlFor="ingredients">Ingrédients</label>
        <span id="ingredients-hint" className="field-hint">Un ingrédient par ligne.</span>
        <textarea
          id="ingredients"
          name="ingredients"
          value={values.ingredients}
          onChange={handleChange}
          aria-invalid={Boolean(errors.ingredients)}
          aria-describedby={errors.ingredients ? 'ingredients-hint ingredients-error' : 'ingredients-hint'}
        />
        <div className="field-footer">
          {errors.ingredients && <p id="ingredients-error" className="field-error">{errors.ingredients}</p>}
          <span className={`field-counter${values.ingredients.length > 2000 ? ' is-over' : ''}`}>
            {values.ingredients.length} / 2000
          </span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="instructions">Préparation</label>
        <textarea
          id="instructions"
          name="instructions"
          value={values.instructions}
          onChange={handleChange}
          aria-invalid={Boolean(errors.instructions)}
          aria-describedby={errors.instructions ? 'instructions-error' : undefined}
        />
        <div className="field-footer">
          {errors.instructions && <p id="instructions-error" className="field-error">{errors.instructions}</p>}
          <span className={`field-counter${values.instructions.length > 5000 ? ' is-over' : ''}`}>
            {values.instructions.length} / 5000
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : submitLabel}
        </button>
        <Link to={cancelTo} className="btn btn-secondary">Annuler</Link>
      </div>
    </form>
  );
}

export default RecipeForm;
