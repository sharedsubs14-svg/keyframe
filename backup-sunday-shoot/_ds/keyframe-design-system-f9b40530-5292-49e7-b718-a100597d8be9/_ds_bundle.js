/* @ds-bundle: {"format":3,"namespace":"KeyframeDesignSystem_f9b405","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"c9c2fcbd209d","components/core/Avatar.jsx":"75b4daea872d","components/core/Badge.jsx":"b00fb327ebc2","components/core/Button.jsx":"5b65797efd43","components/core/Card.jsx":"784011bb0c32","components/forms/Input.jsx":"bc6983d62e7d","components/forms/Switch.jsx":"bc916330f25e","components/navigation/Tabs.jsx":"0c757119117b"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KeyframeDesignSystem_f9b405 = window.KeyframeDesignSystem_f9b405 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe logo — the wordmark ("key" + phi + "rame", phi replaces the f) and
 * the standalone logomark (phi only). Purely typographic, set in Cormorant
 * Garamond. Cream letters, lavender phi, on Void or Obsidian only.
 */
function Logo({
  variant = 'wordmark',
  tagline = false,
  size = 48,
  className = '',
  style = {},
  ...rest
}) {
  const phi = /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-wordmark)',
      color: 'var(--lavender)',
      fontWeight: 500,
      fontStyle: 'normal'
    }
  }, "\u03C6");
  if (variant === 'mark') {
    return /*#__PURE__*/React.createElement("span", _extends({
      className: className,
      style: {
        fontFamily: 'var(--font-wordmark)',
        color: 'var(--lavender)',
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        display: 'inline-block',
        ...style
      },
      "aria-label": "Keyframe"
    }, rest), "\u03C6");
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      lineHeight: 1,
      ...style
    },
    "aria-label": "Keyframe \u2014 think like a director"
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-wordmark)',
      color: 'var(--cream)',
      fontWeight: 500,
      fontSize: size,
      lineHeight: 0.95,
      letterSpacing: '0.01em'
    }
  }, "key", phi, "rame"), tagline && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-wordmark)',
      fontStyle: 'italic',
      color: 'var(--cream)',
      fontWeight: 400,
      fontSize: size * 0.3,
      marginTop: size * 0.08,
      letterSpacing: '0.02em'
    }
  }, "think like a director"));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe avatar. Round, hairline-bordered. Shows an image, initials, or the
 * phi logomark watermark. Used for instructor and member identities.
 */
function Avatar({
  src,
  name = '',
  size = 40,
  mark = false,
  className = '',
  style = {},
  ...rest
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: '1px solid var(--border-hairline)',
      background: 'var(--elevated)',
      color: 'var(--orchid-gray)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
      fontFamily: mark ? 'var(--font-wordmark)' : 'var(--font-body)',
      fontWeight: mark ? 500 : 600,
      fontSize: mark ? size * 0.5 : size * 0.36,
      ...style
    },
    "aria-label": name || 'avatar'
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : mark ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--lavender)'
    }
  }, "\u03C6") : initials || /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--lavender)'
    }
  }, "\u03C6"));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe badge / pill. Small status or category marker. Subtle by default,
 * accent for emphasis. Uses the lowercase wide-tracked label treatment.
 */
function Badge({
  variant = 'neutral',
  className = '',
  style = {},
  children,
  ...rest
}) {
  const variants = {
    neutral: {
      background: 'var(--elevated)',
      color: 'var(--orchid-gray)',
      border: '1px solid var(--border-hairline)'
    },
    accent: {
      background: 'color-mix(in oklab, var(--royal) 18%, transparent)',
      color: 'var(--lavender)',
      border: '1px solid color-mix(in oklab, var(--royal) 40%, transparent)'
    },
    champagne: {
      background: 'color-mix(in oklab, var(--champagne) 14%, transparent)',
      color: 'var(--champagne)',
      border: '1px solid color-mix(in oklab, var(--champagne) 38%, transparent)'
    },
    solid: {
      background: 'var(--royal)',
      color: 'var(--text-on-accent)',
      border: '1px solid transparent'
    }
  };
  const v = variants[variant] || variants.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 11,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'lowercase',
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...v,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe button. Royal primary for CTAs, hairline-bordered secondary,
 * and quiet ghost. Inter, medium weight, restrained.
 */
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  style = {},
  children,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '7px 14px',
      fontSize: 13,
      radius: 'var(--radius-sm)'
    },
    md: {
      padding: '10px 20px',
      fontSize: 14,
      radius: 'var(--radius-sm)'
    },
    lg: {
      padding: '14px 28px',
      fontSize: 15,
      radius: 'var(--radius-md)'
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'var(--royal)',
      color: 'var(--text-on-accent)',
      border: '1px solid transparent'
    },
    secondary: {
      background: 'var(--elevated)',
      color: 'var(--cream)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--cream)',
      border: '1px solid transparent'
    }
  };
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    "data-variant": variant,
    className: `kf-btn ${className}`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: s.fontSize,
      lineHeight: 1,
      letterSpacing: '0.005em',
      padding: s.padding,
      borderRadius: s.radius,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
      ...v,
      ...style
    }
  }, rest), children, /*#__PURE__*/React.createElement("style", null, `
        .kf-btn[data-variant="primary"]:not(:disabled):hover { background: var(--orchid); }
        .kf-btn[data-variant="secondary"]:not(:disabled):hover { border-color: var(--royal); }
        .kf-btn[data-variant="ghost"]:not(:disabled):hover { background: var(--elevated); }
        .kf-btn:not(:disabled):active { transform: translateY(1px); }
        .kf-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--focus-ring); }
      `));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe card. Sits on Elevated with a hairline border and a 12px radius.
 * Low-key shadow, optional accent glow on hover for interactive cards.
 */
function Card({
  interactive = false,
  padding = 24,
  className = '',
  style = {},
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `kf-card ${interactive ? 'kf-card--interactive' : ''} ${className}`,
    style: {
      background: 'var(--elevated)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      padding,
      color: 'var(--text-secondary)',
      transition: 'border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)',
      ...style
    }
  }, rest), children, /*#__PURE__*/React.createElement("style", null, `
        .kf-card--interactive { cursor: pointer; }
        .kf-card--interactive:hover {
          border-color: color-mix(in oklab, var(--royal) 45%, transparent);
          box-shadow: var(--glow-accent);
          transform: translateY(-2px);
        }
      `));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe text input. Obsidian field, hairline border, cream text,
 * Royal focus ring. Optional lowercase label above.
 */
function Input({
  label,
  id,
  className = '',
  style = {},
  ...rest
}) {
  const inputId = id || (label ? `kf-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%'
    },
    className: className
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 11,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'lowercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    className: "kf-input",
    style: {
      width: '100%',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--cream)',
      background: 'var(--obsidian)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      padding: '11px 14px',
      outline: 'none',
      transition: 'border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
      ...style
    }
  }, rest)), /*#__PURE__*/React.createElement("style", null, `
        .kf-input::placeholder { color: var(--mauve-muted); }
        .kf-input:focus { border-color: var(--royal); box-shadow: 0 0 0 3px var(--focus-ring); }
      `));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe switch toggle. Royal when on, hairline track when off.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  id,
  className = '',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    id: id,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    className: className,
    style: {
      width: 44,
      height: 26,
      borderRadius: 'var(--radius-pill)',
      border: '1px solid ' + (checked ? 'transparent' : 'var(--border-strong)'),
      background: checked ? 'var(--royal)' : 'var(--obsidian)',
      position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
      padding: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 20 : 2,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: checked ? '#fff' : 'var(--orchid-gray)',
      transition: 'left var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)'
    }
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyframe tabs. Underline-style navigation. Active tab in cream with a
 * Royal underline; inactive in secondary text.
 */
function Tabs({
  tabs = [],
  value,
  onChange,
  className = '',
  style = {},
  ...rest
}) {
  const active = value != null ? value : tabs[0] && tabs[0].id;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    className: className,
    style: {
      display: 'flex',
      gap: 28,
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, rest), tabs.map(t => {
    const isActive = t.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      role: "tab",
      "aria-selected": isActive,
      onClick: () => onChange && onChange(t.id),
      style: {
        appearance: 'none',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0 0 14px',
        fontFamily: 'var(--font-body)',
        fontWeight: isActive ? 600 : 500,
        fontSize: 14,
        color: isActive ? 'var(--cream)' : 'var(--text-secondary)',
        borderBottom: '2px solid ' + (isActive ? 'var(--royal)' : 'transparent'),
        marginBottom: -1,
        transition: 'color var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)'
      }
    }, t.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
