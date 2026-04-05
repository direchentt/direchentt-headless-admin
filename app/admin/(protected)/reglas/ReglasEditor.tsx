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

type TabId = 'general' | 'checkout' | 'modules' | 'marketing';

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: 'general', label: 'General', short: 'Gen.' },
  { id: 'checkout', label: 'Checkout', short: 'Pay' },
  { id: 'modules', label: 'Módulos', short: 'Mods' },
  { id: 'marketing', label: 'Marketing', short: 'Mkt' },
];

export default function ReglasEditor({ storeId, shopParam, initial }: Props) {
  const [tab, setTab] = useState<TabId>('general');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const f = initial.flags ?? {};
  const m = initial.marketing ?? {};

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
          preferExpressShipping: fd.get('flag_preferExpressShipping') === 'on',
          lowStockUrgencyCopy: fd.get('flag_lowStockUrgencyCopy') === 'on',
          verboseStorefrontLogs: fd.get('flag_verboseStorefrontLogs') === 'on',
        },
        marketing: {
          announcementEnabled: fd.get('m_ann_on') === 'on',
          announcementText: String(fd.get('m_ann_text') ?? ''),
          announcementLink: String(fd.get('m_ann_link') ?? ''),
          utmCampaignTemplate: String(fd.get('m_utm') ?? ''),
          notasCampanas: String(fd.get('m_notas') ?? ''),
          objetivoConversion: String(fd.get('m_obj') ?? ''),
        },
      });
      if (r.ok) {
        setMsg({
          type: 'ok',
          text: 'Cambios guardados. Los datos se fusionan en MongoDB (no se pierden claves futuras).',
        });
      } else setMsg({ type: 'err', text: r.error });
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

      <div className={reglas.tabBar} role="tablist" aria-label="Secciones de reglas">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${reglas.tabBtn} ${tab === t.id ? reglas.tabBtnActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className={reglas.tabLong}>{t.label}</span>
            <span className={reglas.tabShort}>{t.short}</span>
          </button>
        ))}
      </div>

      <div
        className={reglas.tabPanel}
        role="tabpanel"
        hidden={tab !== 'general'}
        aria-hidden={tab !== 'general'}
      >
        <section className={reglas.section}>
          <h2 className={reglas.h2}>Mantenimiento y operación</h2>
          <p className={reglas.hint}>
            Flags y textos de referencia. El storefront puede leer <code>maintenanceMode</code> cuando lo
            integres en layout o API pública.
          </p>
          <label className={reglas.check}>
            <input type="checkbox" name="maintenanceMode" defaultChecked={initial.maintenanceMode} />
            <span>Modo mantenimiento</span>
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
            <span>Notas internas (solo panel)</span>
            <textarea
              name="internalNotes"
              rows={4}
              defaultValue={initial.internalNotes ?? ''}
              placeholder="Runbooks, IDs de prueba, contactos de agencia…"
            />
          </label>
        </section>
      </div>

      <div
        className={reglas.tabPanel}
        role="tabpanel"
        hidden={tab !== 'checkout'}
        aria-hidden={tab !== 'checkout'}
      >
        <section className={reglas.section}>
          <h2 className={reglas.h2}>Checkout y post-compra</h2>
          <p className={reglas.hint}>
            Textos guía para emails, página de gracias o legales. Validá copy con tu equipo antes de
            publicar.
          </p>
          <label className={reglas.field}>
            <span>Mensaje post-compra (referencia)</span>
            <textarea
              name="checkoutSuccessNote"
              rows={3}
              defaultValue={initial.checkoutSuccessNote ?? ''}
              placeholder="Plazos de envío, WhatsApp de soporte, etc."
            />
          </label>
          <label className={reglas.field}>
            <span>Hint legal / términos (referencia)</span>
            <textarea
              name="checkoutLegalHint"
              rows={3}
              defaultValue={initial.checkoutLegalHint ?? ''}
              placeholder="Cambios, devoluciones, arrepentimiento (consultá con asesor legal)."
            />
          </label>
        </section>
      </div>

      <div
        className={reglas.tabPanel}
        role="tabpanel"
        hidden={tab !== 'modules'}
        aria-hidden={tab !== 'modules'}
      >
        <section className={reglas.section}>
          <h2 className={reglas.h2}>Módulos técnicos</h2>
          <p className={reglas.hint}>
            Interruptores para despliegues graduales. Algunos requieren código adicional en el storefront.
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
          <label className={reglas.check}>
            <input
              type="checkbox"
              name="flag_preferExpressShipping"
              defaultChecked={Boolean(f.preferExpressShipping)}
            />
            <span>Priorizar envío exprés cuando haya opciones configuradas</span>
          </label>
          <label className={reglas.check}>
            <input
              type="checkbox"
              name="flag_lowStockUrgencyCopy"
              defaultChecked={Boolean(f.lowStockUrgencyCopy)}
            />
            <span>Activar copy de urgencia por stock bajo (cuando esté cableado en fichas)</span>
          </label>
          <label className={reglas.check}>
            <input
              type="checkbox"
              name="flag_verboseStorefrontLogs"
              defaultChecked={Boolean(f.verboseStorefrontLogs)}
            />
            <span>Logs más verbosos de señales storefront (solo diagnóstico)</span>
          </label>
        </section>
      </div>

      <div
        className={reglas.tabPanel}
        role="tabpanel"
        hidden={tab !== 'marketing'}
        aria-hidden={tab !== 'marketing'}
      >
        <section className={reglas.section}>
          <h2 className={reglas.h2}>Playbook de campañas</h2>
          <p className={reglas.hint}>
            Centralizá mensajes y UTMs para el equipo. Podés leer estos campos desde el storefront o
            automatizaciones cuando los cablees.
          </p>
          <label className={reglas.check}>
            <input type="checkbox" name="m_ann_on" defaultChecked={Boolean(m.announcementEnabled)} />
            <span>Barra / anuncio activo (flag + texto)</span>
          </label>
          <label className={reglas.field}>
            <span>Texto del anuncio</span>
            <textarea
              name="m_ann_text"
              rows={2}
              defaultValue={m.announcementText ?? ''}
              placeholder="Ej.: Envío gratis en compras mayores a $X esta semana."
            />
          </label>
          <label className={reglas.field}>
            <span>Enlace del anuncio (opcional)</span>
            <input
              type="url"
              name="m_ann_link"
              defaultValue={m.announcementLink ?? ''}
              placeholder="https://…"
              className={reglas.input}
            />
          </label>
          <label className={reglas.field}>
            <span>Plantilla de campaña UTM</span>
            <input
              type="text"
              name="m_utm"
              defaultValue={m.utmCampaignTemplate ?? ''}
              placeholder="ej. liquidacion_invierno_2026"
              className={reglas.input}
            />
          </label>
          <label className={reglas.field}>
            <span>Notas de campañas</span>
            <textarea
              name="m_notas"
              rows={4}
              defaultValue={m.notasCampanas ?? ''}
              placeholder="Brief: audiencia, presupuesto, fechas, creatividades aprobadas…"
            />
          </label>
          <label className={reglas.field}>
            <span>Objetivo de conversión declarado</span>
            <textarea
              name="m_obj"
              rows={2}
              defaultValue={m.objetivoConversion ?? ''}
              placeholder="Ej.: subir ticket medio un 8% en 30 días."
            />
          </label>
        </section>
      </div>

      <div className={reglas.actions}>
        <button type="submit" className={reglas.submit} disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar todo'}
        </button>
        <span className={styles.pagerMuted}>
          Tienda <strong>#{shopParam}</strong> · merge en MongoDB
        </span>
      </div>
    </form>
  );
}
