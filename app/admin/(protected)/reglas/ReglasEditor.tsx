'use client';

import { useState, useTransition } from 'react';
import type { AdminPanelStored } from '@/lib/admin-panel-db';
import { saveAdminPanelRules } from '../commerce-actions';
import styles from '../admin-pages.module.css';
import reglas from './reglas.module.css';

type Props = {
  storeId: number;
  shopParam: string;
  initial: AdminPanelStored;
};

export default function ReglasEditor({ storeId, shopParam, initial }: Props) {
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const f = initial.flags ?? {};

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const r = await saveAdminPanelRules(storeId, {
        maintenanceMode: fd.get('maintenanceMode') === 'on',
        maintenanceMessage: String(fd.get('maintenanceMessage') ?? ''),
        internalNotes: String(fd.get('internalNotes') ?? ''),
        checkoutSuccessNote: String(fd.get('checkoutSuccessNote') ?? ''),
        checkoutLegalHint: String(fd.get('checkoutLegalHint') ?? ''),
        flags: {
          experimentalCartSync: fd.get('flag_experimentalCartSync') === 'on',
          strictStockMessages: fd.get('flag_strictStockMessages') === 'on',
          logCheckoutErrors: fd.get('flag_logCheckoutErrors') === 'on',
        },
      });
      if (r.ok) setMsg({ type: 'ok', text: 'Cambios guardados en MongoDB (colección admin_panel_settings).' });
      else setMsg({ type: 'err', text: r.error });
    });
  }

  return (
    <form className={reglas.form} onSubmit={onSubmit}>
      {msg ? (
        <div
          className={`${styles.alert} ${msg.type === 'ok' ? styles.alertInfo : styles.alertErr}`}
          role="status"
        >
          {msg.text}
        </div>
      ) : null}

      <section className={reglas.section}>
        <h2 className={reglas.h2}>Mantenimiento y avisos</h2>
        <p className={reglas.hint}>
          Textos de referencia para tu operación. Podés enlazarlos después en la vitrina o en emails (vía
          integraciones).
        </p>
        <label className={reglas.check}>
          <input type="checkbox" name="maintenanceMode" defaultChecked={initial.maintenanceMode} />
          <span>Modo mantenimiento (flag interno; el storefront puede leerlo en una futura versión)</span>
        </label>
        <label className={reglas.field}>
          <span>Mensaje de mantenimiento</span>
          <textarea
            name="maintenanceMessage"
            rows={2}
            defaultValue={initial.maintenanceMessage ?? ''}
            placeholder="Ej.: Estamos actualizando el checkout. Volvé en unos minutos."
          />
        </label>
        <label className={reglas.field}>
          <span>Notas internas (solo este panel)</span>
          <textarea
            name="internalNotes"
            rows={3}
            defaultValue={initial.internalNotes ?? ''}
            placeholder="Recordatorios para el equipo, IDs de prueba, etc."
          />
        </label>
      </section>

      <section className={reglas.section}>
        <h2 className={reglas.h2}>Checkout y legal</h2>
        <label className={reglas.field}>
          <span>Mensaje post-compra (referencia)</span>
          <textarea
            name="checkoutSuccessNote"
            rows={2}
            defaultValue={initial.checkoutSuccessNote ?? ''}
            placeholder="Texto sugerido después de pagar: plazos de envío, WhatsApp, etc."
          />
        </label>
        <label className={reglas.field}>
          <span>Hint legal / términos (referencia)</span>
          <textarea
            name="checkoutLegalHint"
            rows={2}
            defaultValue={initial.checkoutLegalHint ?? ''}
            placeholder="Frase corta sobre cambios y devoluciones (consultá con tu abogado)."
          />
        </label>
      </section>

      <section className={reglas.section}>
        <h2 className={reglas.h2}>Módulos y reglas avanzadas (flags)</h2>
        <p className={reglas.hint}>
          Interruptores técnicos. Algunos aún no están cableados al storefront: sirven para preparar
          despliegues y documentar intención.
        </p>
        <label className={reglas.check}>
          <input
            type="checkbox"
            name="flag_experimentalCartSync"
            defaultChecked={Boolean(f.experimentalCartSync)}
          />
          <span>Sincronización experimental del carrito (API)</span>
        </label>
        <label className={reglas.check}>
          <input
            type="checkbox"
            name="flag_strictStockMessages"
            defaultChecked={Boolean(f.strictStockMessages)}
          />
          <span>Mensajes estrictos de stock en checkout</span>
        </label>
        <label className={reglas.check}>
          <input type="checkbox" name="flag_logCheckoutErrors" defaultChecked={Boolean(f.logCheckoutErrors)} />
          <span>Registrar errores de checkout en logs del servidor</span>
        </label>
      </section>

      <div className={reglas.actions}>
        <button type="submit" className={reglas.submit} disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar reglas'}
        </button>
        <span className={styles.pagerMuted}>
          Tienda <strong>#{shopParam}</strong> · datos en MongoDB
        </span>
      </div>
    </form>
  );
}
